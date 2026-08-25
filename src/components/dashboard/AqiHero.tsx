import { Card } from "@/components/ui/card";
import { aqiCategory } from "@/lib/aqi";
import { categoryBgClass, categoryTextClass, riskTextClass } from "@/lib/category-class";
import { fmtDateTime, windLabel } from "@/lib/format";
import type { DataBundle } from "@/lib/types";

export function AqiHero({ bundle }: { bundle: DataBundle }) {
  const { current, location } = bundle;
  const band = aqiCategory(current.aq.aqi);

  return (
    <Card className="relative overflow-hidden p-6">
      <div
        className={`absolute inset-x-0 top-0 h-1 ${categoryBgClass(band.category)}`}
        aria-hidden
      />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {location.name} · live composite AQI
          </p>
          <div className="mt-2 flex items-end gap-4">
            <span className={`font-num text-6xl leading-none ${categoryTextClass(band.category)}`}>
              {current.aq.aqi}
            </span>
            <div className="pb-1">
              <p className={`text-lg font-semibold ${categoryTextClass(band.category)}`}>
                {band.category}
              </p>
              <p className="text-xs text-muted-foreground">
                Risk level{" "}
                <span className={`font-semibold ${riskTextClass(current.risk)}`}>
                  {current.risk}
                </span>
              </p>
            </div>
          </div>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">{band.advice}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Updated {fmtDateTime(bundle.generatedAt)} · scenario “{bundle.scenario.name}”
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
          <Metric label="PM2.5" value={`${current.aq.pm25} µg/m³`} />
          <Metric label="PM10" value={`${current.aq.pm10} µg/m³`} />
          <Metric label="Wind" value={windLabel(current.weather.windSpeed, current.weather.windDirection)} />
          <Metric label="Temperature" value={`${current.weather.temperature.toFixed(1)} °C`} />
          <Metric label="Humidity" value={`${Math.round(current.weather.humidity)} %`} />
          <Metric label="Boundary layer" value={`${Math.round(current.weather.pblHeight)} m`} />
          <Metric label="Rainfall" value={`${current.weather.rainfall.toFixed(1)} mm/h`} />
          <Metric label="Pressure" value={`${Math.round(current.weather.pressure)} hPa`} />
          <Metric label="Stability" value={current.weather.stability} />
        </dl>
      </div>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="font-num mt-0.5 text-base text-foreground">{value}</dd>
    </div>
  );
}
