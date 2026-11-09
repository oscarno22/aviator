/** Shared between the client and /api/chat. No SDK imports here. */
export type ChatMode = "radio" | "oral" | "popquiz";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  mode: ChatMode;
  scenarioId?: string;   // radio
  areaId?: string;       // oral: ACS area id
  weakTags?: string[];   // popquiz: concept areas the SRS store marks weak
  messages: ChatMessage[];
  pilot?: { tailNumber?: string; callsign?: string; trainingAirport?: string; homeAirport?: string; name?: string };
}

/** Response is a text/plain stream. Everything before the marker is in-character speech. */
export const COACH_MARKER = "---COACH---";
export const ERROR_MARKER = "---ERROR---";
export const MAX_MESSAGES = 40;
export const MAX_MESSAGE_CHARS = 2000;
