const KEYS: [string, string][] = [
  ["↑ / ↓", "Push / pull (pitch)"], ["← / →", "Roll"], [", / .", "Rudder"],
  ["W / S", "Throttle up / down"], ["F / V", "Flaps down / up"], ["T / G", "Trim nose up / down"],
  ["P", "Pause"], ["R", "Reset"],
];

export default function KeyHelp() {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
      {KEYS.map(([k, d]) => (
        <div key={k} className="flex items-baseline gap-2">
          <kbd className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[11px]">{k}</kbd>
          <span className="text-muted">{d}</span>
        </div>
      ))}
      <p className="col-span-2 mt-1 text-muted">A gamepad or joystick works too: press any button on it first. Left stick flies, right stick x is rudder, A/B flaps, bumpers trim.</p>
    </div>
  );
}
