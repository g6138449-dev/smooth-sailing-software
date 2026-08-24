import { Card } from "@/components/ui/card";
import type { SourceContribution, FireEvent } from "@/lib/types";
import { degToCompass } from "@/lib/coupling";
import { timeAgo } from "@/lib/format";

export function AttributionPanel({
  attribution,
  fires,
}: {
  attribution: SourceContribution[];
  fires: FireEvent[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-foreground">Source attribution</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Estimated share of PM2.5 mass by emission sector for this scenario.
        </p>
        <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full">
          {attribution.map((s) => (
            <span
              key={s.key}
              style={{ width: `${s.pct}%`, backgroundColor: s.color }}
              title={`${s.label} ${s.pct}%`}
            />
          ))}
        </div>
        <ul className="mt-4 space-y-3">
          {attribution.map((s) => (
            <li key={s.key}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="flex items-center gap-2 text-sm text-foreground">
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: s.color }}
                    aria-hidden
                  />
                  {s.label}
                </span>
                <span className="font-num text-sm text-foreground">
                  {s.pct}%
                  <span
                    className={`ml-2 text-xs ${s.trend > 0 ? "text-status-poor" : "text-status-good"}`}
                  >
                    {s.trend > 0 ? "+" : ""}
                    {s.trend}%
                  </span>
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.explanation}</p>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-semibold text-foreground">Upwind fire hotspots</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Detections that can feed smoke into the NCR airshed.
        </p>
        {fires.length === 0 ? (
          <p className="mt-3 text-sm text-status-good">No significant hotspots detected.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {[...fires]
              .sort((a, b) => b.intensity - a.intensity)
              .map((f) => (
                <li
                  key={f.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-border p-3"
                >
                  <div>
                    <span className="text-sm font-medium text-foreground">{f.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {f.distanceKm} km {degToCompass(f.bearingFromNcr)} of Delhi ·{" "}
                      {timeAgo(f.detectedAt)}
                    </span>
                  </div>
                  <span className="font-num text-sm text-status-poor">
                    {Math.round(f.intensity)} MW
                  </span>
                </li>
              ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
