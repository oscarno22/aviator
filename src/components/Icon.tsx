import type { SVGProps } from "react";

export type IconName =
  | "home" | "list" | "plane" | "gauge" | "cards" | "cockpit" | "radio"
  | "mic" | "book" | "cloud" | "settings" | "more" | "check" | "chevron"
  | "play" | "pause" | "reset" | "x" | "eye" | "eyeOff" | "download" | "upload";

const PATHS: Record<IconName, string> = {
  home: "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  list: "M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01",
  plane: "M2 16l20-8-6 8 2 6-4-2-4 2 1-6z",
  gauge: "M12 20a8 8 0 1 1 8-8M12 12l4-4M12 12h.01",
  cards: "M4 6h12v12H4zM8 4h12v12",
  cockpit: "M3 8h18v10H3zM7 12h.01M12 12h.01M17 12h.01M3 8l3-4h12l3 4",
  radio: "M4 9h16v11H4zM8 5l8-2M8 14a2 2 0 1 0 4 0 2 2 0 1 0-4 0M15 13h2M15 16h2",
  mic: "M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zM19 12a7 7 0 0 1-14 0M12 19v3",
  book: "M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z",
  cloud: "M7 18a4 4 0 0 1-.5-8A6 6 0 0 1 18 9a4 4 0 0 1 0 9z",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a7 7 0 0 0-1.7-1L14.5 3h-5l-.3 2.6a7 7 0 0 0-1.7 1l-2.4-1-2 3.5L5.1 11a7 7 0 0 0 0 2l-2 1.5 2 3.5 2.4-1a7 7 0 0 0 1.7 1l.3 2.6h5l.3-2.6a7 7 0 0 0 1.7-1l2.4 1 2-3.5-2-1.5c.1-.3.1-.7.1-1z",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  check: "M5 13l4 4L19 7",
  chevron: "M9 6l6 6-6 6",
  play: "M6 4l14 8-14 8z",
  pause: "M6 5h4v14H6zM14 5h4v14h-4z",
  reset: "M3 12a9 9 0 1 0 3-6.7M3 4v5h5",
  x: "M6 6l12 12M18 6L6 18",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  eyeOff: "M3 3l18 18M10.6 10.6A3 3 0 0 0 13.4 13.4M9.9 5.2A10 10 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.6 6.6A17 17 0 0 0 2 12s4 7 10 7a10 10 0 0 0 4.4-1",
  download: "M12 3v12M6 11l6 6 6-6M4 21h16",
  upload: "M12 21V9M6 13l6-6 6 6M4 3h16",
};

export default function Icon({ name, size = 22, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      <path d={PATHS[name]} />
    </svg>
  );
}
