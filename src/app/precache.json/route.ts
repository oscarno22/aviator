import { CHECKLISTS } from "@/data/checklists";
import { MANEUVERS } from "@/data/maneuvers";

export const dynamic = "force-static";

/** Every static URL the service worker should have available offline. */
export function GET() {
  const urls = [
    "/", "/offline", "/more", "/settings",
    "/checklists", ...CHECKLISTS.map((c) => `/checklists/${c.id}`),
    "/maneuvers", ...MANEUVERS.map((m) => `/maneuvers/${m.id}`),
    "/quiz", "/cockpit", "/sim", "/logbook", "/weather", "/radio", "/oral",
    "/icons/icon-192.png", "/icons/icon-512.png", "/icons/apple-touch-icon.png",
  ];
  return Response.json({ urls }, { headers: { "Cache-Control": "no-cache" } });
}
