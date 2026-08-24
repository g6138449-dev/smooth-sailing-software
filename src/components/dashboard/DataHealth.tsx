import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/format";
import type { DataSourceStatus } from "@/lib/types";

export function DataHealth({ health }: { health: DataSourceStatus[] }) {
  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-foreground">Data source health</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Every feed runs through a provider interface, so demo and live sources are
        interchangeable.
      </p>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {health.map((h) => (
          <li key={h.id} className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-foreground">{h.name}</span>
              <Badge
                variant="outline"
                className={`text-[10px] uppercase ${
                  h.status === "operational"
                    ? "text-status-good"
                    : h.status === "degraded"
                      ? "text-status-moderate"
                      : "text-status-severe"
                }`}
              >
                {h.status}
              </Badge>
            </div>
            <p className="font-num mt-1 text-xs text-muted-foreground">
              {h.mode} mode · {h.completeness}% complete · {h.missingCount} gaps · updated{" "}
              {timeAgo(h.lastUpdate)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{h.note}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
