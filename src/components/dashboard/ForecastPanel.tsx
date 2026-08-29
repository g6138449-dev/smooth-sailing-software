import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { categoryBgClass, categoryTextClass, riskTextClass } from "@/lib/category-class";
import { fmtDayHour } from "@/lib/format";
import { MODEL_VERSION } from "@/lib/aqi";
import {
  FORECAST_HORIZONS,
  forecastNarrative,
  horizonLabel,
  recordAtHorizon,
  riskScore,
} from "@/lib/forecast";
import { cn } from "@/lib/utils";
import type { DataBundle } from "@/lib/types";

export function ForecastPanel({
  bundle,
  horizon,
  onHorizonChange,
}: {
  bundle: DataBundle;
  horizon: number;
  onHorizonChange: (h: number) => void;
}) {
  const selected = recordAtHorizon(bundle, horizon);
  const score = riskScore(selected.aqi, bundle.coupling.accumulationPotential);
  const observedPm25 = bundle.current.aq.pm25;
  const delta = selected.pm25 - observedPm25;

  return (
    <Card className="p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Forecast horizon</h3>
          <p className="text-xs text-muted-foreground">
            Select a horizon to load its record from the 72-hour hourly forecast series.
          </p>
        </div>
        <Badge variant="secondary" className="font-num text-[11px]">
          {MODEL_VERSION}
        </Badge>
      </div>

      {/* Horizon selector */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Forecast horizon">
        {FORECAST_HORIZONS.map((h) => {
          const point = recordAtHorizon(bundle, h);
          const active = h === horizon;
          return (
            <button
              key={h}
              type="button"
              aria-pressed={active}
              onClick={() => onHorizonChange(h)}
              className={cn(
                "min-w-[92px] rounded-xl border px-3 py-2 text-left transition-colors",
                active
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-accent/60",
              )}
            >
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {horizonLabel(h)}
              </span>
              <span
                className={cn(
                  "font-num block text-lg leading-tight",
                  categoryTextClass(point.category),
                )}
              >
                {point.aqi}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected record detail */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="relative overflow-hidden rounded-2xl border border-border p-4">
          <div
            className={cn("absolute inset-x-0 top-0 h-1", categoryBgClass(selected.category))}
            aria-hidden
          />
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {horizonLabel(selected.horizonHours)} ·{" "}
              {selected.horizonHours === 0 ? "observed" : "predicted"}
            </span>
            <span className="font-num text-xs text-muted-foreground">
              {fmtDayHour(selected.timestamp)}
            </span>
          </div>

          <div className="mt-3 flex items-end gap-4">
            <span
              className={cn(
                "font-num text-5xl leading-none",
                categoryTextClass(selected.category),
              )}
            >
              {selected.aqi}
            </span>
            <div className="pb-1">
              <p className={cn("text-sm font-semibold", categoryTextClass(selected.category))}>
                {selected.category}
              </p>
              <p className="text-xs text-muted-foreground">
                Risk{" "}
                <span className={cn("font-semibold", riskTextClass(selected.risk))}>
                  {selected.risk}
                </span>
              </p>
            </div>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <Field label="Predicted PM2.5" value={`${selected.pm25} µg/m³`} />
            <Field label="Predicted PM10" value={`${selected.pm10} µg/m³`} />
            <Field label="NO₂" value={`${selected.no2} µg/m³`} />
            <Field label="O₃" value={`${selected.o3} µg/m³`} />
            <Field
              label="Change vs now"
              value={`${delta > 0 ? "+" : ""}${Math.round(delta)} µg/m³`}
            />
            <Field label="Risk score" value={`${score} / 100`} />
          </dl>

          <div className="mt-4">
            <div className="flex items-baseline justify-between text-xs text-muted-foreground">
              <span>Forecast confidence</span>
              <span className="font-num">{selected.confidence}%</span>
            </div>
            <Progress value={selected.confidence} className="mt-1.5 h-1.5" />
          </div>
        </div>

        <div className="rounded-2xl border border-border p-4">
          <h4 className="text-sm font-semibold text-foreground">
            Main contributing factors
          </h4>
          <ul className="mt-3 space-y-2">
            {selected.factors
              .slice()
              .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
              .slice(0, 4)
              .map((f) => (
                <li key={f.key} className="rounded-lg border border-border p-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">
                      <span
                        className={
                          f.impact > 0 ? "text-status-poor" : "text-status-good"
                        }
                      >
                        {f.impact > 0 ? "▲" : "▼"}
                      </span>{" "}
                      {f.label}
                    </span>
                    <span className="font-num text-xs text-muted-foreground">{f.value}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{f.detail}</p>
                </li>
              ))}
          </ul>

          <h4 className="mt-4 text-sm font-semibold text-foreground">Forecast explanation</h4>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {forecastNarrative(bundle, selected)}
          </p>
        </div>
      </div>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="font-num mt-0.5 text-base text-foreground">{value}</dd>
    </div>
  );
}
