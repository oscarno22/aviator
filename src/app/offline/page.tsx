export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
      <h1 className="text-xl font-semibold">You&rsquo;re offline</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        Checklists, maneuvers, quiz cards, the cockpit map and the sim all work offline once they have loaded.
        Radio, oral exam and weather need a connection.
      </p>
    </div>
  );
}
