import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Menu, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { NAV_ITEMS } from "@/lib/nav";
import { LOCATIONS } from "@/lib/locations";
import { SCENARIOS } from "@/lib/scenarios";
import { getDataProvider } from "@/lib/providers";
import { MODEL_VERSION, TIME_RANGES } from "@/lib/aqi";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DataBundle, ScenarioKey, TimeRangeKey } from "@/lib/types";

interface ConsoleState {
  bundle: DataBundle;
  hours: number;
  range: TimeRangeKey;
  scenario: ScenarioKey;
  setScenario: (s: ScenarioKey) => void;
  locationId: string;
}

const ConsoleContext = createContext<ConsoleState | null>(null);

export function useConsole(): ConsoleState {
  const ctx = useContext(ConsoleContext);
  if (!ctx) throw new Error("useConsole must be used inside <Shell>");
  return ctx;
}

const STORE_KEY = "aerosense-console-prefs";

export function Shell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const [locationId, setLocationId] = useState("ncr");
  const [scenario, setScenario] = useState<ScenarioKey>("normal");
  const [range, setRange] = useState<TimeRangeKey>("24h");
  const [collapsed, setCollapsed] = useState(false);
  const [tick, setTick] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  // Restore console preferences after hydration so pages stay in sync.
  useEffect(() => {
    setHydrated(true);
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<{
        locationId: string;
        scenario: ScenarioKey;
        range: TimeRangeKey;
        collapsed: boolean;
      }>;
      if (saved.locationId) setLocationId(saved.locationId);
      if (saved.scenario) setScenario(saved.scenario);
      if (saved.range) setRange(saved.range);
      if (typeof saved.collapsed === "boolean") setCollapsed(saved.collapsed);
    } catch {
      /* ignore malformed prefs */
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(
      STORE_KEY,
      JSON.stringify({ locationId, scenario, range, collapsed }),
    );
  }, [hydrated, locationId, scenario, range, collapsed]);

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
  const activeAlerts = bundle?.alerts.filter((a) => a.status === "active").length ?? 0;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        alertCount={activeAlerts}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
          <div className="flex flex-wrap items-center gap-2 px-4 py-3">
            <div className="mr-auto min-w-0">
              <h1 className="truncate text-base font-semibold tracking-tight text-foreground">
                {title}
              </h1>
              <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
            </div>

            <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
              Demo data
            </Badge>

            <Select value={locationId} onValueChange={setLocationId}>
              <SelectTrigger className="w-[170px]" aria-label="Region">
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
              <SelectTrigger className="w-[180px]" aria-label="Scenario">
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
              <SelectTrigger className="w-[150px]" aria-label="Time range">
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

        <main className="mx-auto w-full max-w-7xl flex-1 space-y-4 px-4 py-5">
          {query.isError && (
            <Card className="p-4">
              <p className="text-sm text-destructive">
                Could not load the data bundle. Try refreshing.
              </p>
            </Card>
          )}

          {!bundle && !query.isError && <LoadingState />}

          {bundle && (
            <ConsoleContext.Provider
              value={{ bundle, hours, range, scenario, setScenario, locationId }}
            >
              <p className="text-xs text-muted-foreground">
                {bundle.location.name} · {bundle.scenario.description} · feed updated{" "}
                {timeAgo(bundle.generatedAt)}
              </p>
              {children}
            </ConsoleContext.Provider>
          )}
        </main>

        <footer className="border-t border-border px-4 py-5">
          <p className="text-xs text-muted-foreground">
            Prototype using demo providers · {MODEL_VERSION} · interfaces ready for CPCB/CAAQMS,
            ERA5 and NASA FIRMS feeds.
          </p>
        </footer>
      </div>
    </div>
  );
}

function Sidebar({
  collapsed,
  onToggle,
  alertCount,
}: {
  collapsed: boolean;
  onToggle: () => void;
  alertCount: number;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex",
        collapsed ? "w-[68px]" : "w-[262px]",
      )}
    >
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  title={item.label}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-sidebar-accent font-semibold text-primary"
                      : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {!collapsed && item.to === "/alerts" && alertCount > 0 && (
                    <span className="ml-auto rounded bg-sev-warning/20 px-1.5 py-0.5 font-num text-[10px] text-sev-warning">
                      {alertCount}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={onToggle}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
        >
          <Menu className="size-4 shrink-0" aria-hidden />
          {!collapsed && <span>Collapse sidebar</span>}
        </button>
        {!collapsed && (
          <p className="px-3 pt-2 text-[11px] text-muted-foreground">{MODEL_VERSION}</p>
        )}
      </div>
    </aside>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-40 w-full rounded-3xl" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-3xl" />
        ))}
      </div>
      <Skeleton className="h-72 w-full rounded-3xl" />
    </div>
  );
}
