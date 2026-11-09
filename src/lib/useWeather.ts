"use client";

import { useEffect, useState } from "react";
import { read, write } from "./storage";
import { weatherCacheKey, type WeatherResponse } from "./metar";
import { useStored } from "./useStored";

/** Fetches METAR/TAF for the given ids, keeping the last good response for offline use. */
export function useWeather(ids: string[]) {
  const key = ids.map((s) => s.toUpperCase()).filter(Boolean).join(",");
  const [cached] = useStored(weatherCacheKey);
  const [state, setState] = useState<{ data: WeatherResponse | null; error: string | null; loading: boolean }>({ data: null, error: null, loading: true });

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    fetch(`/api/weather?ids=${encodeURIComponent(key)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return (await r.json()) as WeatherResponse;
      })
      .then((data) => { if (cancelled) return; write(weatherCacheKey, data); setState({ data, error: null, loading: false }); })
      .catch((e) => { if (cancelled) return; setState({ data: read(weatherCacheKey), error: e instanceof Error ? e.message : "Weather unavailable", loading: false }); });
    return () => { cancelled = true; };
  }, [key]);

  return { data: state.data ?? cached, error: state.error, loading: state.loading, stale: !state.data && !!cached };
}
