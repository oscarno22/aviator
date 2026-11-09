# Aviator

A training companion for a Cessna 172S private pilot student in the Charlotte area. Built as an installable web app so it works on a phone in a hotel room and on an older MacBook.

| Area | What it does | Offline? |
|---|---|---|
| Checklists | 172S normal and emergency checklists, tap-to-check, memory-item quiz | yes |
| Maneuvers | 24 ACS maneuver cards with entry, steps, callouts, tolerances, common errors, and a chair-fly mode that reads callouts aloud | yes |
| Quiz | 247 instructor-style concept cards with spaced repetition, drill by area, 5-card pop quiz | yes |
| Cockpit | Tappable 172S panel and walkaround with a "what is this?" spot quiz | yes |
| Sim | Six-pack or G1000-style panel driven by a point-mass 172S model, 10 practice tasks graded to ACS tolerances, keyboard/gamepad/touch, WebSerial hook for hardware | yes |
| Radio | Claude plays Concord Ground/Tower, Charlotte Approach, or Monroe CTAF traffic; an instructor grades each call | no |
| Oral exam | Claude as a DPE by ACS area, or an instructor pop quiz | no |
| Logbook | Entries and progress against 14 CFR 61.109(a) | yes |
| Weather | METAR/TAF for KJQF and KCLT with the best runway and crosswind | cached |

Everything is a training aid. Verify numbers against the POH, the school's checklist and the current ACS.

## Run it

```bash
npm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY and pick an APP_PASSCODE
npm run dev                  # http://localhost:3000
```

Radio and oral exam need the server env vars. The app sends the passcode from Settings as `x-app-key`; it must equal `APP_PASSCODE`.

```bash
npm test          # vitest: flight model, scoring, serial protocol, 61.109 math, METAR decode, SRS
npm run lint
npm run build
```

## Install on a phone

Deploy to Vercel (set `ANTHROPIC_API_KEY` and `APP_PASSCODE` in the project settings), open the URL in Safari, Share → Add to Home Screen. The installed app keeps its own storage, separate from the Safari tab, so install once and stay in it. Use Settings → Export to move progress between devices.

## Sim controls

| Key | Action |
|---|---|
| ↑ / ↓ | push / pull |
| ← / → | roll |
| , / . | rudder |
| W / S | throttle |
| F / V | flaps down / up |
| T / G | trim nose up / down |
| P, R | pause, reset |

A gamepad works after you press any button on it. On touch screens the on-screen stick, throttle and rudder appear automatically.

## Hardware (WebSerial)

Chromium desktop only. Click "Connect serial" on the sim page. Newline-delimited JSON at 115200 baud, defined in `src/sim/io/protocol.ts` (with tests in `tests/protocol.test.ts`):

- Host → device, 10 Hz: `{"t":"state","v":1,"ias":98.2,"alt":3012,"hdg":274.5,"vs":-120,"pitch":1.3,"bank":-2.1,"tr":0,"ball":0.05,"rpm":2310,"flaps":0,"g":1.02,"horn":false,"stall":false,"paused":false}`
- Device → host, any rate, partial allowed: `{"t":"ctl","v":1,"ele":-0.12,"ail":0.3,"rud":0,"thr":0.8,"flaps":10,"trim":0.1}`
- Handshake: device sends `{"t":"hello","v":1,"name":"yoke-v1","caps":["ele","ail","thr"],"rate":20}`; host replies `{"t":"hello","v":1,"app":"aviator","rate":10}`.

If no `ctl` line arrives for one second the device stops asserting and the keyboard or touch controls take over.

## Layout

- `src/data` — checklists, maneuvers, concept cards, cockpit items, airports, radio scenarios, oral topics
- `src/sim` — engine, aircraft model, loop, input/output bus, tasks, scoring
- `src/lib` — storage, spaced repetition, speech, prompts, 61.109, METAR
- `src/app/api/chat` — the only server-side Claude code
- `src/sw/sw.template.js` — service worker, served at `/sw.js` with a per-deploy version stamped in by `src/app/sw.js/route.ts`; `/precache.json` lists every static page
