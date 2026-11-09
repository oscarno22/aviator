/**
 * WebSerial bridge (Chromium desktop only). One port acts as both an input
 * source (ctl lines) and an output sink (state lines at 10 Hz).
 */
import type { ControlInputs, SimSnapshot } from "../types";
import type { InputSource, OutputSink } from "./types";
import { LineSplitter, ctlToInputs, encodeHello, encodeState, parseLine } from "./protocol";

type Port = {
  open(o: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
  addEventListener?: (t: string, cb: () => void) => void;
};
type SerialNav = Navigator & { serial?: { requestPort(): Promise<Port> } };

export const serialSupported = () => typeof navigator !== "undefined" && "serial" in navigator;

const CTL_TIMEOUT_MS = 1000;

export class SerialBridge implements InputSource, OutputSink {
  readonly id = "serial";
  readonly priority = 40;
  readonly rateHz = 10;
  private port: Port | null = null;
  private reader: ReadableStreamDefaultReader<string> | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private latest: Partial<ControlInputs> = {};
  private lastCtlAt = 0;
  private closed = false;
  deviceName = "";
  malformed = 0;
  status = "not connected";
  onLog?: (msg: string) => void;
  private listeners = new Set<() => void>();

  /** External-store style subscription so React can render status without mutating the bridge. */
  subscribe = (cb: () => void) => { this.listeners.add(cb); return () => { this.listeners.delete(cb); }; };
  getStatus = () => this.status;
  private setStatus(s: string) { this.status = s; this.listeners.forEach((cb) => cb()); }

  async connect(): Promise<void> {
    const nav = navigator as SerialNav;
    if (!nav.serial) throw new Error("WebSerial not supported in this browser");
    this.port = await nav.serial.requestPort();
    await this.port.open({ baudRate: 115200 });
    this.closed = false;
    this.port.addEventListener?.("disconnect", () => this.teardown("disconnected"));
    const enc = new TextEncoder();
    this.writer = this.port.writable?.getWriter() ?? null;
    await this.writer?.write(enc.encode(encodeHello(this.rateHz)));
    this.readLoop();
    this.setStatus("connected");
  }

  private async readLoop() {
    if (!this.port?.readable) return;
    const decoder = new TextDecoderStream();
    this.port.readable.pipeTo(decoder.writable as unknown as WritableStream<Uint8Array>).catch(() => {});
    this.reader = decoder.readable.getReader();
    const splitter = new LineSplitter();
    try {
      while (!this.closed) {
        const { value, done } = await this.reader.read();
        if (done) break;
        for (const line of splitter.push(value)) this.handle(line);
      }
    } catch {
      /* port went away */
    }
    this.teardown("closed");
  }

  private handle(line: string) {
    const m = parseLine(line);
    if (!m) { this.malformed++; return; }
    if (m.t === "ctl") { this.latest = ctlToInputs(m); this.lastCtlAt = performance.now(); }
    else if (m.t === "hello") { this.deviceName = m.name ?? "device"; this.setStatus(`hello from ${this.deviceName}`); }
    else if (m.t === "log") this.onLog?.(m.msg);
    else if (m.t === "ping") this.send(JSON.stringify({ t: "pong", n: m.n }) + "\n");
  }

  private send(text: string) {
    this.writer?.write(new TextEncoder().encode(text)).catch(() => {});
  }

  start() {}
  stop() { this.teardown("stopped"); }

  private async teardown(reason: string) {
    if (this.closed) return;
    this.closed = true;
    try { await this.reader?.cancel(); } catch {}
    try { this.writer?.releaseLock(); } catch {}
    try { await this.port?.close(); } catch {}
    this.port = null; this.reader = null; this.writer = null; this.latest = {};
    this.setStatus(reason);
  }

  get connected() { return !!this.port && !this.closed; }

  /** Stops asserting if the device goes quiet so keyboard/touch regain control. */
  poll(): Partial<ControlInputs> | null {
    if (!this.connected) return null;
    if (performance.now() - this.lastCtlAt > CTL_TIMEOUT_MS) return null;
    return Object.keys(this.latest).length ? this.latest : null;
  }

  update(snapshot: SimSnapshot) {
    if (this.connected) this.send(encodeState(snapshot));
  }
}
