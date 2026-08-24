import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { severityBgClass, severityTextClass, riskTextClass } from "@/lib/category-class";
import { fmtDateTime } from "@/lib/format";
import { SEVERITY_META, pollutantMeta } from "@/lib/aqi";
import type { AlertItem } from "@/lib/types";

export function AlertsPanel({ alerts }: { alerts: AlertItem[] }) {
  if (alerts.length === 0) {
    return (
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-foreground">Active alerts</h3>
        <p className="mt-2 text-sm text-status-good">
          No alerts for this scenario — forecast stays below warning thresholds.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Active alerts</h3>
        <Badge variant="secondary" className="font-num text-[11px]">
          {alerts.length} issued
        </Badge>
      </div>
      <ul className="mt-3 space-y-3">
        {alerts.map((a) => (
          <li key={a.id} className="relative overflow-hidden rounded-lg border border-border p-3">
            <span
              className={`absolute inset-y-0 left-0 w-1 ${severityBgClass(a.severity)}`}
              aria-hidden
            />
            <div className="flex flex-wrap items-baseline justify-between gap-2 pl-2">
              <div>
                <span className={`text-xs font-semibold ${severityTextClass(a.severity)}`}>
                  {SEVERITY_META[a.severity]?.label}
                </span>
                <span className="ml-2 text-sm font-medium text-foreground">{a.title}</span>
              </div>
              <span className="font-num text-xs text-muted-foreground">
                {a.region} · issued {fmtDateTime(a.issuedAt)}
              </span>
            </div>
            <p className="mt-1.5 pl-2 text-xs text-muted-foreground">{a.reason}</p>
            <p className="font-num mt-1.5 pl-2 text-xs text-muted-foreground">
              {pollutantMeta(a.pollutant).label} {a.currentValue} → {a.predictedValue}{" "}
              {pollutantMeta(a.pollutant).unit} in {a.expectedInHours} h · risk{" "}
              <span className={riskTextClass(a.risk)}>{a.risk}</span>
            </p>
            <ul className="mt-2 space-y-1 pl-2">
              {a.recommendations.map((r) => (
                <li key={r} className="text-xs text-muted-foreground">
                  • {r}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </Card>
  );
}
