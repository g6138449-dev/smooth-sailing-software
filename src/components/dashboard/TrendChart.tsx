import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { fmtTime } from "@/lib/format";
import { recordAtHorizon, horizonLabel } from "@/lib/forecast";
import type { DataBundle } from "@/lib/types";

export function TrendChart({
  bundle,
  hours,
  horizon,
}: {
  bundle: DataBundle;
  hours: number;
  /** When set, the matching forecast point is highlighted on the chart. */
  horizon?: number;
}) {
  const history = bundle.aqHistory.slice(-hours).map((o) => ({
    ts: o.timestamp,
    observed: o.pm25,
    predicted: null as number | null,
  }));
  const forecast = bundle.forecast.map((f) => ({
    ts: f.timestamp,
    observed: null as number | null,
    predicted: f.pm25,
  }));
  const last = history[history.length - 1];
  if (last) last.predicted = last.observed;
  const data = [...history, ...forecast];

  const nowTs = bundle.current.weather.timestamp;
  const forecastEnd = forecast[forecast.length - 1]?.ts ?? nowTs;
  const marker = horizon === undefined ? null : recordAtHorizon(bundle, horizon);

  return (
    <Card className="p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            PM2.5 observed vs forecast
          </h3>
          <p className="text-xs text-muted-foreground">
            Last {hours} h of observations followed by the {bundle.forecast.length} h baseline
            forecast.
            {marker ? ` Highlighted: ${horizonLabel(marker.horizonHours)} → ${marker.pm25} µg/m³.` : ""}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-chart-1" /> Observed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-chart-3" /> Forecast
          </span>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -12 }}>
            <defs>
              <linearGradient id="observedFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="ts"
              tickFormatter={(v: number) => fmtTime(v)}
              stroke="var(--color-muted-foreground)"
              fontSize={11}
              minTickGap={28}
            />
            <YAxis
              stroke="var(--color-muted-foreground)"
              fontSize={11}
              unit=""
              width={44}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-popover)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                fontSize: 12,
                color: "var(--color-popover-foreground)",
              }}
              labelFormatter={(v) => fmtTime(Number(v))}
              formatter={(value: unknown, name) => [`${value} µg/m³`, String(name)]}
            />
            <ReferenceLine
              y={60}
              stroke="var(--color-muted-foreground)"
              strokeDasharray="4 4"
              label={{ value: "guideline", fontSize: 10, fill: "var(--color-muted-foreground)" }}
            />
            <Area
              type="monotone"
              dataKey="observed"
              name="Observed"
              stroke="var(--color-chart-1)"
              strokeWidth={2}
              fill="url(#observedFill)"
              connectNulls
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="predicted"
              name="Forecast"
              stroke="var(--color-chart-3)"
              strokeWidth={2}
              strokeDasharray="5 4"
              connectNulls
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
