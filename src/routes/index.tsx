import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { AqiHero } from "@/components/dashboard/AqiHero";
import { PollutantGrid } from "@/components/dashboard/PollutantGrid";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { ForecastPanel } from "@/components/dashboard/ForecastPanel";
import { CouplingPanel } from "@/components/dashboard/CouplingPanel";
import { StationsTable } from "@/components/dashboard/StationsTable";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { AttributionPanel } from "@/components/dashboard/AttributionPanel";
import { DataHealth } from "@/components/dashboard/DataHealth";
import { EpisodesPanel } from "@/components/dashboard/EpisodesPanel";

import { LOCATIONS } from "@/lib/locations";
import { SCENARIOS } from "@/lib/scenarios";
import { getDataProvider } from "@/lib/providers";
import { TIME_RANGES } from "@/lib/aqi";
import { downloadCsv, timeAgo } from "@/lib/format";
import type { ScenarioKey, TimeRangeKey } from "@/lib/types";

const TITLE = "AeroSense NCR — Air Quality Forecast & Weather Coupling";
const DESCRIPTION =
  "Operational dashboard for Delhi NCR air quality: live AQI, 72-hour PM2.5 forecasts, weather–pollution coupling, station readings and alerts.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: Index,
});

function Index() {
  const [locationId, setLocationId] = useState("ncr");
  const [scenario, setScenario] = useState<ScenarioKey>("normal");
  const [range, setRange] = useState<TimeRangeKey>("24h");
  const [horizon, setHorizon] = useState(24);
  const [tick, setTick] = useState(0);

  // Refresh the demo feed on a fixed cadence, like an operations console.
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const query = useQuery({
    queryKey: ["bundle", locationId, scenario, tick],
    queryFn: () => getDataProvider().getBundle(locationId, scenario, tick),
    staleTime: 60_000,
  });

  const bundle = query.data;
  const hours = TIME_RANGES.find((r) => r.key === range)?.hours ?? 24;

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <div className="mr-auto">
            <h1 className="text-base font-semibold tracking-tight text-foreground">
              AeroSense <span className="text-primary">NCR</span>
            </h1>
            <p className="text-xs text-muted-foreground">
              Air quality forecasting &amp; weather-coupling console
            </p>
          </div>

          <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
            Demo data
          </Badge>

          <Select value={locationId} onValueChange={setLocationId}>
            <SelectTrigger className="w-[190px]" aria-label="Region">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOCATIONS.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={scenario} onValueChange={(v) => setScenario(v as ScenarioKey)}>
            <SelectTrigger className="w-[200px]" aria-label="Scenario">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCENARIOS.map((s) => (
                <SelectItem key={s.key} value={s.key}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={range} onValueChange={(v) => setRange(v as TimeRangeKey)}>
            <SelectTrigger className="w-[160px]" aria-label="Time range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGES.map((r) => (
                <SelectItem key={r.key} value={r.key}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setTick((t) => t + 1)}
            disabled={query.isFetching}
          >
            <RefreshCw className={query.isFetching ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-4 px-4 py-6">
        {query.isError && (
          <Card className="p-4">
            <p className="text-sm text-destructive">
              Could not load the data bundle. Try refreshing.
            </p>
          </Card>
        )}

        {!bundle && !query.isError && <LoadingState />}

        {bundle && (
          <>
            <p className="text-xs text-muted-foreground">
              {bundle.scenario.description} · feed updated {timeAgo(bundle.generatedAt)}
            </p>

            <AqiHero bundle={bundle} />

            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="forecast">Forecast</TabsTrigger>
                <TabsTrigger value="coupling">Coupling</TabsTrigger>
                <TabsTrigger value="sources">Sources</TabsTrigger>
                <TabsTrigger value="system">System</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4 space-y-4">
                <PollutantGrid aq={bundle.current.aq} />
                <TrendChart bundle={bundle} hours={hours} />
                <AlertsPanel alerts={bundle.alerts} />
                <StationsTable readings={bundle.stations} />
              </TabsContent>

              <TabsContent value="forecast" className="mt-4 space-y-4">
                <ForecastPanel
                  bundle={bundle}
                  horizon={horizon}
                  onHorizonChange={setHorizon}
                />
                <TrendChart bundle={bundle} hours={hours} horizon={horizon} />
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      downloadCsv(
                        `aerosense-forecast-${bundle.location.id}-${bundle.scenario.key}.csv`,
                        bundle.forecast.map((f) => ({
                          horizon_hours: f.horizonHours,
                          timestamp: new Date(f.timestamp).toISOString(),
                          pm25: f.pm25,
                          pm10: f.pm10,
                          aqi: f.aqi,
                          category: f.category,
                          risk: f.risk,
                          confidence: f.confidence,
                        })),
                      )
                    }
                  >
                    Export forecast CSV
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="coupling" className="mt-4 space-y-4">
                <CouplingPanel coupling={bundle.coupling} />
                <Card className="p-4">
                  <h3 className="text-sm font-semibold text-foreground">Why this forecast</h3>
                  <ul className="mt-3 space-y-2">
                    {bundle.coupling.explanations.map((f) => (
                      <li key={f.key} className="rounded-lg border border-border p-3">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="text-sm font-medium text-foreground">{f.label}</span>
                          <span className="font-num text-xs text-muted-foreground">{f.value}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{f.detail}</p>
                      </li>
                    ))}
                  </ul>
                </Card>
              </TabsContent>

              <TabsContent value="sources" className="mt-4 space-y-4">
                <AttributionPanel attribution={bundle.attribution} fires={bundle.fires} />
                <EpisodesPanel episodes={bundle.episodes} />
              </TabsContent>

              <TabsContent value="system" className="mt-4 space-y-4">
                <DataHealth health={bundle.health} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      <footer className="border-t border-border px-4 py-6">
        <p className="mx-auto max-w-7xl text-xs text-muted-foreground">
          Prototype using demo providers. Interfaces are ready for CPCB/CAAQMS, ERA5 and NASA
          FIRMS feeds.
        </p>
      </footer>
    </main>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-44 w-full" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="h-72 w-full" />
    </div>
  );
}
