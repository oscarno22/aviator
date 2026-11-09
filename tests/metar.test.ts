import { describe, expect, it } from "vitest";
import { ceilingFt, flightCategory, tafLines, visibilitySm, windComponents, altimeterInHg, type MetarJson } from "@/lib/metar";

const base: MetarJson = { icaoId: "KCLT", temp: 29, dewp: 17, wdir: 240, wspd: 12, wgst: 18, visib: "10+", altim: 1016.6, clouds: [{ cover: "FEW", base: 4500 }, { cover: "SCT", base: 25000 }] };

describe("metar", () => {
  it("ignores few/scattered layers for the ceiling", () => {
    expect(ceilingFt(base)).toBeNull();
    expect(ceilingFt({ ...base, clouds: [{ cover: "SCT", base: 1500 }, { cover: "BKN", base: 2500 }, { cover: "OVC", base: 4000 }] })).toBe(2500);
  });
  it("parses '10+' visibility", () => {
    expect(visibilitySm(base)).toBe(10);
    expect(visibilitySm({ ...base, visib: 2.5 })).toBe(2.5);
  });
  it("derives flight category when fltCat is missing", () => {
    expect(flightCategory(base)).toBe("VFR");
    expect(flightCategory({ ...base, clouds: [{ cover: "BKN", base: 2500 }] })).toBe("MVFR");
    expect(flightCategory({ ...base, visib: 2 })).toBe("IFR");
    expect(flightCategory({ ...base, clouds: [{ cover: "OVC", base: 400 }] })).toBe("LIFR");
    expect(flightCategory({ ...base, fltCat: "IFR" })).toBe("IFR");
  });
  it("computes head and crosswind for a runway", () => {
    const w = windComponents(240, 12, 196)!;   // wind 44° right of runway 20 at Concord
    expect(w.head).toBe(9);
    expect(w.cross).toBe(8);
    expect(windComponents(16, 10, 196)!.head).toBe(-10); // tailwind on 20
    expect(windComponents("VRB", 4, 196)!.variable).toBe(true);
  });
  it("converts hPa altimeter to inHg", () => {
    expect(altimeterInHg(base)).toBe("30.02");
    expect(altimeterInHg({ ...base, altim: 29.92 })).toBe("29.92");
  });
  it("splits a TAF into groups", () => {
    const lines = tafLines("TAF KCLT 251720Z 2518/2624 24010KT P6SM FEW050 FM260000 22006KT P6SM SCT250 TEMPO 2606/2609 4SM BR");
    expect(lines.length).toBe(3);
    expect(lines[1].startsWith("FM260000")).toBe(true);
  });
});
