const IDS = /^[A-Z0-9]{3,4}(,[A-Z0-9]{3,4}){0,4}$/;
const BASE = "https://aviationweather.gov/api/data";

export async function GET(request: Request) {
  const ids = (new URL(request.url).searchParams.get("ids") ?? "").toUpperCase();
  if (!IDS.test(ids)) return new Response("ids must be 1–5 ICAO identifiers, comma separated", { status: 400 });
  try {
    const [m, t] = await Promise.all([
      fetch(`${BASE}/metar?ids=${ids}&format=json`, { next: { revalidate: 300 }, headers: { "user-agent": "aviator-trainer" } }),
      fetch(`${BASE}/taf?ids=${ids}&format=json`, { next: { revalidate: 300 }, headers: { "user-agent": "aviator-trainer" } }),
    ]);
    if (!m.ok) return new Response(`Weather source error ${m.status}`, { status: 502 });
    const metars = await m.json();
    const tafs = t.ok ? await t.json() : [];
    return Response.json({ metars, tafs, fetchedAt: new Date().toISOString() }, {
      headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch {
    return new Response("Could not reach aviationweather.gov", { status: 502 });
  }
}
