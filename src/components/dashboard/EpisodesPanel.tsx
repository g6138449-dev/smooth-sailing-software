import { Card } from "@/components/ui/card";
import type { DataBundle } from "@/lib/types";

export function EpisodesPanel({ episodes }: { episodes: DataBundle["episodes"] }) {
  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-foreground">Recent pollution episodes</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Reference cases used to sanity-check the coupling logic.
      </p>
      <ul className="mt-3 space-y-2">
        {episodes.map((e) => (
          <li
            key={e.label}
            className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-border p-3"
          >
            <div>
              <span className="text-sm font-medium text-foreground">{e.label}</span>
              <span className="block text-xs text-muted-foreground">
                {e.start} · {e.hours} h · driver: {e.driver}
              </span>
            </div>
            <span className="font-num text-sm text-status-poor">peak PM2.5 {e.peakPm25}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
