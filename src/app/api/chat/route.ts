import Anthropic from "@anthropic-ai/sdk";
import { buildSystem } from "@/lib/prompts";
import { AI_ERROR_HEADER, ERROR_MARKER, MAX_MESSAGES, MAX_MESSAGE_CHARS, type AiErrorCode, type ChatRequest } from "@/lib/chat-types";

export const maxDuration = 60;

const MODEL = "claude-opus-5-5";

/** Every failure carries a machine-readable reason so the client can decide whether to fall back to scripted drills. */
function fail(message: string, status: number, code: AiErrorCode) {
  return new Response(message, { status, headers: { [AI_ERROR_HEADER]: code } });
}

function unauthorized() {
  return fail("Passcode required. Set it in Settings.", 401, "passcode");
}

function isBilling(err: InstanceType<typeof Anthropic.APIError>): boolean {
  if (err.status === 402 || err.type === "billing_error") return true;
  // Observed 2026-11-09: an account with no credit answers 400 invalid_request_error,
  // distinguishable only by its message. Either way the client falls back; this just labels it.
  return err.status === 400 && /credit balance/i.test(err.message);
}

function validate(body: unknown): ChatRequest | string {
  if (!body || typeof body !== "object") return "Bad request";
  const b = body as Record<string, unknown>;
  if (!["radio", "oral", "popquiz"].includes(String(b.mode))) return "Unknown mode";
  if (!Array.isArray(b.messages)) return "messages must be an array";
  if (b.messages.length > MAX_MESSAGES) return `At most ${MAX_MESSAGES} messages`;
  const messages: ChatRequest["messages"] = [];
  for (const m of b.messages as unknown[]) {
    if (!m || typeof m !== "object") return "Bad message";
    const { role, content } = m as { role?: unknown; content?: unknown };
    if (role !== "user" && role !== "assistant") return "Bad role";
    if (typeof content !== "string" || content.length > MAX_MESSAGE_CHARS) return "Bad message content";
    messages.push({ role, content });
  }
  const pilot = b.pilot && typeof b.pilot === "object" ? (b.pilot as ChatRequest["pilot"]) : undefined;
  return {
    mode: b.mode as ChatRequest["mode"],
    scenarioId: typeof b.scenarioId === "string" ? b.scenarioId : undefined,
    areaId: typeof b.areaId === "string" ? b.areaId : undefined,
    weakTags: Array.isArray(b.weakTags) ? (b.weakTags as unknown[]).filter((t): t is string => typeof t === "string").slice(0, 6) : undefined,
    messages,
    pilot: pilot ? { tailNumber: str(pilot.tailNumber), callsign: str(pilot.callsign), trainingAirport: str(pilot.trainingAirport), homeAirport: str(pilot.homeAirport) } : undefined,
  };
}
const str = (x: unknown) => (typeof x === "string" ? x.slice(0, 60) : undefined);

/** Merge consecutive same-role turns and make sure the conversation starts with the user. */
function normalize(messages: ChatRequest["messages"]): Anthropic.MessageParam[] {
  const out: Anthropic.MessageParam[] = [];
  for (const m of messages) {
    const text = m.content.trim();
    if (!text) continue;
    const last = out[out.length - 1];
    if (last && last.role === m.role) last.content = `${last.content}\n${text}`;
    else out.push({ role: m.role, content: text });
  }
  if (out.length === 0 || out[0].role !== "user") out.unshift({ role: "user", content: "(Begin.)" });
  return out;
}

export async function POST(request: Request) {
  const expected = process.env.APP_PASSCODE;
  if (!expected) return fail("Server is missing APP_PASSCODE.", 500, "config");
  if (request.headers.get("x-app-key") !== expected) return unauthorized();

  let body: unknown;
  try { body = await request.json(); } catch { return fail("Invalid JSON", 400, "bad-request"); }
  const req = validate(body);
  if (typeof req === "string") return fail(req, 400, "bad-request");

  const sys = buildSystem(req);
  const client = new Anthropic();
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: sys.maxTokens,
    output_config: { effort: "low" },
    system: [
      { type: "text", text: sys.base },
      { type: "text", text: sys.context },
      { type: "text", text: sys.pilot, cache_control: { type: "ephemeral" } },
    ],
    messages: normalize(req.messages),
  });

  // Pull the first event before building the Response so auth/rate-limit errors get real status codes.
  const iterator = stream[Symbol.asyncIterator]();
  let first: IteratorResult<Anthropic.MessageStreamEvent>;
  try {
    first = await iterator.next();
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) return fail("The server's Anthropic API key was rejected.", 500, "auth");
    if (err instanceof Anthropic.PermissionDeniedError) return fail("The server's Anthropic API key is not allowed to do this.", 500, "auth");
    if (err instanceof Anthropic.RateLimitError) return fail("Rate limited by the API. Try again in a minute.", 429, "rate");
    if (err instanceof Anthropic.APIError && isBilling(err)) return fail("The Anthropic account has no credit.", 402, "billing");
    if (err instanceof Anthropic.APIError) return fail(`API error ${err.status ?? ""}: ${err.message}`, 502, "upstream");
    return fail("Could not reach the API.", 502, "config");
  }

  const enc = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      const push = (ev: Anthropic.MessageStreamEvent) => {
        if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") controller.enqueue(enc.encode(ev.delta.text));
      };
      try {
        if (!first.done) push(first.value);
        for (;;) {
          const { value, done } = await iterator.next();
          if (done) break;
          push(value);
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") controller.enqueue(enc.encode(`\n${ERROR_MARKER}The model declined this request.`));
        else if (final.stop_reason === "max_tokens") controller.enqueue(enc.encode(`\n${ERROR_MARKER}Reply was cut off; try again.`));
      } catch (err) {
        const msg = err instanceof Anthropic.APIError ? err.message : "Stream interrupted.";
        controller.enqueue(enc.encode(`\n${ERROR_MARKER}${msg}`));
      } finally {
        controller.close();
      }
    },
    cancel() { stream.abort(); },
  });

  return new Response(readable, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-cache, no-transform", "x-accel-buffering": "no" },
  });
}
