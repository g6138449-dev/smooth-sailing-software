import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { categoryTextClass, riskTextClass } from "@/lib/category-class";
import { fmtDayHour } from "@/lib/format";
import { MODEL_VERSION } from "@/lib/aqi";
import type { ForecastPoint } from "@/lib/types";

const HORIZONS = [6, 12, 24, 48, 72];

export function ForecastPanel({ points }: { points: ForecastPoint[] }) {
  const picks = HORIZONS.map(
    (h) => points.find((p) => p.horizonHours === h) ?? points[points.length - 1],
  ).filter((p): p is ForecastPoint => Boolean(p));

  return (
    <Card className="p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">Forecast horizons</h3>
        <Badge variant="secondary" className="font-num text-[11px]">
          {MODEL_VERSION}
        </Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {picks.map((p) => (
          <div key={p.horizonHours} className="rounded-lg border border-border p-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                +{p.horizonHours} h
              </span>
              <span className="font-num text-xs text-muted-foreground">
                {fmtDayHour(p.timestamp)}
              </span>
            </div>
            <div className="mt-2 flex items-end justify-between">
              <span className={`font-num text-3xl leading-none ${categoryTextClass(p.category)}`}>
                {p.aqi}
              </span>
              <div className="text-right">
                <p className={`text-xs font-semibold ${categoryTextClass(p.category)}`}>
                  {p.category}
                </p>
                <p className={`text-xs ${riskTextClass(p.risk)}`}>{p.risk}</p>
              </div>
            </div>
            <p className="font-num mt-2 text-xs text-muted-foreground">
              PM2.5 {p.pm25} · PM10 {p.pm10} · confidence {p.confidence}%
            </p>
            <ul className="mt-2 space-y-1">
              {p.factors.slice(0, 3).map((f) => (
                <li key={f.key} className="text-xs text-muted-foreground">
                  <span className={f.impact > 0 ? "text-status-poor" : "text-status-good"}>
                    {f.impact > 0 ? "▲" : "▼"}
                  </span>{" "}
                  {f.label}: <span className="font-num">{f.value}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}
