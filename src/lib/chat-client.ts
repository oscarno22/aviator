import { COACH_MARKER, ERROR_MARKER, type ChatRequest } from "./chat-types";

export interface StreamHandlers {
  onSpeech: (text: string) => void;    // accumulated in-character text so far
  onCoach: (text: string) => void;     // accumulated coach note so far (after the marker)
  onDone: (speech: string, coach: string) => void;
  onError: (message: string) => void;
}

export interface ChatClientOptions { passcode: string; signal?: AbortSignal }

/** POSTs to /api/chat and splits the streamed text at the coach marker. */
export async function streamChat(req: ChatRequest, opts: ChatClientOptions, h: StreamHandlers): Promise<void> {
  let res: Response;
  try {
    res = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json", "x-app-key": opts.passcode },
      body: JSON.stringify(req),
      signal: opts.signal,
    });
  } catch (e) {
    if ((e as Error).name === "AbortError") return;
    h.onError("Couldn't reach the server. Are you online?");
    return;
  }
  if (!res.ok || !res.body) {
    const msg = await res.text().catch(() => "");
    h.onError(res.status === 401 ? "Passcode rejected. Set it in Settings." : msg || `Server error ${res.status}`);
    return;
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  const split = () => {
    const errAt = buf.indexOf(ERROR_MARKER);
    const body = errAt >= 0 ? buf.slice(0, errAt) : buf;
    const at = body.indexOf(COACH_MARKER);
    const speech = (at >= 0 ? body.slice(0, at) : body).trim();
    const coach = at >= 0 ? body.slice(at + COACH_MARKER.length).trim() : "";
    return { speech, coach, error: errAt >= 0 ? buf.slice(errAt + ERROR_MARKER.length).trim() : null };
  };
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const { speech, coach } = split();
      // Hide a partially received marker so "---" never flashes in the speech bubble.
      h.onSpeech(speech.replace(/-{1,3}(C(O(A(C(H)?)?)?)?)?$/, "").trimEnd());
      if (coach) h.onCoach(coach);
    }
  } catch (e) {
    if ((e as Error).name === "AbortError") return;
    h.onError("The stream was interrupted.");
    return;
  }
  const { speech, coach, error } = split();
  if (error) { h.onError(error); }
  h.onDone(speech, coach);
}
