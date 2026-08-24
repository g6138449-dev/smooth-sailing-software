import { aqiCategory, pm25ToAqi, riskFromAqi } from "./aqi";
import { computeCoupling, couplingInputFromWeather } from "./coupling";
import { runBaselineForecast } from "./forecast";
import { getLocation, LOCATIONS, STATIONS } from "./locations";
import { makeRng, wave } from "./rng";
import { getScenario } from "./scenarios";
import type {
  AlertItem,
  AqObservation,
  DataBundle,
  DataSourceStatus,
  FireEvent,
  ScenarioKey,
  SourceContribution,
  StationReading,
  WeatherObservation,
} from "./types";

/**
 * Demo Data Engine.
 *
 * Single source of truth for all demo data. Everything on every page is
 * derived here from (location, scenario, tick) so the whole application
 * stays consistent when any of them change. No UI component hardcodes
 * numbers. Demo providers call this engine; real providers can replace
 * them via the interfaces in providers.ts.
 */

const HOUR = 3600_000;
const HISTORY_HOURS = 96;
const FORECAST_HOURS = 72;

function weatherAt(
  seedKey: string,
  timestamp: number,
  t: number, // hour index relative to now
  locationId: string,
  params: ReturnType<typeof getScenario>["params"],
  isForecast: boolean,
): WeatherObservation {
  const loc = getLocation(locationId);
  const hod = new Date(timestamp).getHours();
  const dayPhase = Math.sin((2 * Math.PI * (hod - 9)) / 24);

  // Rainfall scenario: rain band active in first ~18 forecast hours, lighter after
  let rainfall = 0;
  if (params.rainfall > 0) {
    const band = isForecast ? (t < 18 ? 1 : t < 36 ? 0.35 : 0) : t > -30 ? 0.6 : 0;
    rainfall = params.rainfall * band * (0.6 + 0.4 * Math.abs(wave(seedKey + "rain", t)));
  }

  const windSpeed = Math.max(
    0.6,
    params.windSpeed +
      loc.windBias +
      1.4 * Math.sin((2 * Math.PI * (hod - 14)) / 24) +
      wave(seedKey + "ws", t, 0.9),
  );
  const pblBase = Math.max(180, params.pblHeight + loc.pblBias);
  const isDay = hod >= 8 && hod <= 17;
  const pblHeight = Math.max(
    150,
    pblBase * (isDay ? 1.35 : 0.55) + wave(seedKey + "pbl", t, 40),
  );

  const temperature =
    params.temperature + loc.tempBias + 5.2 * dayPhase + wave(seedKey + "tp", t, 0.5);
  const humidity = Math.min(
    98,
    Math.max(
      18,
      params.humidity + loc.humidityBias - 14 * dayPhase + wave(seedKey + "hu", t, 2.5) +
        (rainfall > 0.5 ? 8 : 0),
    ),
  );

  const stability: WeatherObservation["stability"] =
    pblHeight < 500 && windSpeed < 5 ? "stable" : pblHeight > 950 ? "unstable" : "neutral";

  return {
    timestamp,
    temperature,
    humidity,
    windSpeed,
    windDirection: (((params.windDirection + 16 * Math.sin(t * 0.16) + wave(seedKey + "wd", t, 5)) % 360) + 360) % 360,
    rainfall,
    pressure: 1008 + 3 * Math.sin(t * 0.09) + wave(seedKey + "pr", t, 0.5),
    solarRadiation:
      hod >= 6 && hod <= 18
        ? Math.max(0, 620 * Math.sin((Math.PI * (hod - 6)) / 12)) * (rainfall > 0.5 ? 0.25 : 1)
        : 0,
    pblHeight,
    stability,
  };
}

function pollutionAt(
  locationId: string,
  w: WeatherObservation,
  fireIntensity: number,
): AqObservation {
  const loc = getLocation(locationId);
  const coupling = computeCoupling(couplingInputFromWeather(w, fireIntensity));
  const accumulation = coupling.accumulationPotential / 100;
  const hod = new Date(w.timestamp).getHours();
  const morning = Math.exp(-Math.pow(hod - 8.5, 2) / 6);
  const evening = Math.exp(-Math.pow(hod - 19.5, 2) / 8);
  const diurnal = 1 + 0.22 * morning + 0.3 * evening;

  let pm25 = loc.base.pm25 * (0.5 + 1.1 * accumulation) * diurnal;
  if (w.rainfall > 0.1) pm25 *= 1 - Math.min(0.55, w.rainfall * 0.1);
  pm25 = Math.max(8, Math.min(620, pm25));

  const pm10 = Math.max(15, pm25 * (loc.base.pm10 / loc.base.pm25));
  const no2 = Math.max(4, loc.base.no2 * (0.6 + 0.5 * accumulation) * diurnal);
  const o3 = Math.max(
    2,
    loc.base.o3 *
      (1.25 - 0.55 * accumulation) *
      (0.4 + 0.9 * Math.max(0, Math.sin((Math.PI * (hod - 6)) / 12))),
  );
  const so2 = Math.max(2, loc.base.so2 * (0.8 + 0.3 * accumulation));
  const co = Math.max(0.2, loc.base.co * (0.7 + 0.5 * accumulation) * diurnal);

  const aqi = pm25ToAqi(pm25);
  return {
    timestamp: w.timestamp,
    pm25: Math.round(pm25),
    pm10: Math.round(pm10),
    no2: Math.round(no2),
    o3: Math.round(o3),
    so2: Math.round(so2 * 10) / 10,
    co: Math.round(co * 100) / 100,
    aqi,
    category: aqiCategory(aqi).category,
  };
}

const FIRE_SITES: Omit<FireEvent, "intensity" | "detectedAt">[] = [
  { id: "fire-pb-1", name: "Ludhiana cluster, Punjab", lat: 30.9, lon: 75.85, distanceKm: 285, bearingFromNcr: 312 },
  { id: "fire-pb-2", name: "Amritsar rural, Punjab", lat: 31.63, lon: 74.87, distanceKm: 400, bearingFromNcr: 308 },
  { id: "fire-hr-1", name: "Karnal district, Haryana", lat: 29.69, lon: 76.99, distanceKm: 125, bearingFromNcr: 335 },
  { id: "fire-hr-2", name: "Panipat district, Haryana", lat: 29.39, lon: 76.96, distanceKm: 92, bearingFromNcr: 340 },
  { id: "fire-up-1", name: "Baghpat district, UP", lat: 28.94, lon: 77.22, distanceKm: 42, bearingFromNcr: 350 },
];

function buildFires(scenario: ScenarioKey, now: number): FireEvent[] {
  const params = getScenario(scenario).params;
  const active = Math.round((params.fireIntensity / 100) * FIRE_SITES.length);
  return FIRE_SITES.slice(0, Math.max(scenario === "rainfall" ? 0 : 1, active)).map(
    (f, i) => ({
      ...f,
      intensity: Math.round(params.fireIntensity * (0.7 + 0.3 * ((i + 1) / FIRE_SITES.length))),
      detectedAt: now - (i + 2) * HOUR * 3,
    }),
  );
}

function buildAlerts(
  locationId: string,
  scenario: ScenarioKey,
  forecast: ReturnType<typeof runBaselineForecast>,
  now: number,
): AlertItem[] {
  const loc = getLocation(locationId);
  const alerts: AlertItem[] = [];
  const p24 = forecast.find((f) => f.horizonHours >= 24) ?? forecast[23]!;
  const p12 = forecast.find((f) => f.horizonHours >= 12) ?? forecast[11]!;
  const cur = forecast[0]!;

  if (p24.aqi > 350) {
    alerts.push({
      id: `ALR-${scenario.toUpperCase().slice(0, 3)}-2401`,
      severity: "severe",
      title: "Severe pollution warning",
      locationId,
      region: loc.short === "NCR" ? "East Delhi + Ghaziabad corridor" : loc.name,
      issuedAt: now - 40 * 60_000,
      expectedInHours: 18,
      pollutant: "pm25",
      currentValue: cur.pm25,
      predictedValue: p24.pm25,
      risk: "SEVERE",
      reason:
        "Low wind + shallow boundary layer + high existing particulate concentration are projected to compound over the next 18–30 hours.",
      recommendations: [
        "Increase monitoring frequency at eastern NCR stations",
        "Prepare public health advisory for sensitive groups",
        "Notify district disaster-management cells",
        "Pre-position enforcement teams for construction dust control",
      ],
      status: "active",
    });
  } else if (p24.aqi > 280) {
    alerts.push({
      id: `ALR-${scenario.toUpperCase().slice(0, 3)}-2402`,
      severity: "warning",
      title: "Pollution accumulation warning",
      locationId,
      region: loc.short === "NCR" ? "Central NCR" : loc.name,
      issuedAt: now - 55 * 60_000,
      expectedInHours: 24,
      pollutant: "pm25",
      currentValue: cur.pm25,
      predictedValue: p24.pm25,
      risk: "VERY HIGH",
      reason:
        "Marginal dispersion conditions are expected to allow steady particulate accumulation over the next day.",
      recommendations: [
        "Advise schools to review outdoor activity schedules",
        "Increase station observation frequency",
      ],
      status: "active",
    });
  }

  if (scenario === "fire") {
    alerts.push({
      id: "ALR-FIR-2403",
      severity: "watch",
      title: "Upwind fire transport watch",
      locationId,
      region: "NW approach corridor",
      issuedAt: now - 2 * HOUR,
      expectedInHours: 12,
      pollutant: "pm25",
      currentValue: cur.pm25,
      predictedValue: p12.pm25,
      risk: "HIGH",
      reason:
        "Active fire hotspots in Punjab/Haryana align with prevailing NW winds; transported particulate load possible within 12 hours.",
      recommendations: [
        "Track FIRMS feed at 3-hour cadence",
        "Cross-check with satellite aerosol imagery",
      ],
      status: "active",
    });
  }

  if (scenario === "rainfall") {
    alerts.push({
      id: "ALR-RAIN-2404",
      severity: "info",
      title: "Wet deposition improving air quality",
      locationId,
      region: loc.name,
      issuedAt: now - 30 * 60_000,
      expectedInHours: 6,
      pollutant: "pm25",
      currentValue: cur.pm25,
      predictedValue: p12.pm25,
      risk: "MODERATE",
      reason:
        "Rainfall band over NCR is expected to scavenge particulates; concentrations should decline over the next 6–18 hours.",
      recommendations: ["Continue routine monitoring", "Update public bulletin with improving outlook"],
      status: "active",
    });
  }

  alerts.push({
    id: `ALR-SYS-2405`,
    severity: "info",
    title: "Demo data stream nominal",
    locationId,
    region: loc.name,
    issuedAt: now - 6 * HOUR,
    expectedInHours: 0,
    pollutant: "pm25",
    currentValue: cur.pm25,
    predictedValue: cur.pm25,
    risk: "LOW",
    reason: "All demo providers are generating data within expected parameters.",
    recommendations: ["No action required"],
    status: "acknowledged",
  });

  return alerts;
}

const ATTRIBUTION_PROFILES: Record<ScenarioKey, number[]> = {
  // traffic, industry, dust, construction, crop burning, fire hotspots, stagnation
  normal: [32, 18, 14, 10, 8, 6, 12],
  spike: [34, 22, 12, 8, 10, 4, 10],
  stagnation: [24, 14, 8, 6, 12, 10, 26],
  fire: [18, 10, 8, 5, 22, 24, 13],
  rainfall: [36, 20, 6, 12, 6, 2, 18],
};

const ATTRIBUTION_META = [
  { key: "traffic", label: "Traffic", color: "#6fb3e8", explanation: "Vehicular exhaust and resuspension along major corridors; peaks during rush hours." },
  { key: "industry", label: "Industry", color: "#9b8cf2", explanation: "Industrial combustion in NCR periphery estates (demo estimate)." },
  { key: "dust", label: "Dust", color: "#d9b380", explanation: "Road and soil dust resuspension, sensitive to wind speed and soil moisture." },
  { key: "construction", label: "Construction", color: "#8a94a6", explanation: "Construction activity and material handling emissions." },
  { key: "crop", label: "Crop Residue Burning", color: "#f08a3c", explanation: "Seasonal stubble burning in Punjab/Haryana; transport depends on wind alignment." },
  { key: "fire", label: "Fire Hotspots", color: "#e35d4f", explanation: "Active fire detections upwind contributing transported particulates (demo)." },
  { key: "stagnation", label: "Meteorological Stagnation", color: "#5fbf9e", explanation: "Not an emission source — the fraction of pollution attributable to weather trapping existing emissions." },
];

function buildAttribution(scenario: ScenarioKey, seedKey: string): SourceContribution[] {
  const profile = ATTRIBUTION_PROFILES[scenario];
  return ATTRIBUTION_META.map((meta, i) => ({
    ...meta,
    pct: profile[i]!,
    trend: Math.round(wave(seedKey + "attr" + i, 3, 8)),
    affected: ["Delhi (Central)", "Ghaziabad", "Noida"].slice(0, 1 + (i % 3)),
  }));
}

function buildHealth(now: number): DataSourceStatus[] {
  return [
    {
      id: "src-cpcb",
      name: "CPCB / State Boards — Air Quality",
      kind: "air-quality",
      mode: "demo",
      status: "operational",
      lastUpdate: now - 4 * 60_000,
      completeness: 97,
      missingCount: 3,
      note: "Demo provider active. Interface ready for CPCB CAAQMS feed.",
    },
    {
      id: "src-wx",
      name: "Weather — ERA5 / IMD gridded",
      kind: "weather",
      mode: "demo",
      status: "operational",
      lastUpdate: now - 4 * 60_000,
      completeness: 99,
      missingCount: 1,
      note: "Demo provider active. Interface ready for ERA5/Copernicus or IMD feeds.",
    },
    {
      id: "src-fire",
      name: "NASA FIRMS — Fire Hotspots",
      kind: "fire",
      mode: "demo",
      status: "operational",
      lastUpdate: now - 3 * HOUR,
      completeness: 92,
      missingCount: 8,
      note: "Demo provider active. Interface ready for FIRMS VIIRS/MODIS feed.",
    },
    {
      id: "src-forecast",
      name: "Forecast Engine",
      kind: "forecast",
      mode: "demo",
      status: "operational",
      lastUpdate: now - 4 * 60_000,
      completeness: 100,
      missingCount: 0,
      note: "Prototype Baseline v0.1 — transparent rule-based engine. ML/WRF-Chem pluggable.",
    },
  ];
}

export function buildDataBundle(
  locationId: string,
  scenarioKey: ScenarioKey,
  tick: number,
): DataBundle {
  const scenario = getScenario(scenarioKey);
  const location = getLocation(locationId);
  const now = Math.floor(Date.now() / HOUR) * HOUR;
  const seedKey = `${locationId}:${scenarioKey}:${tick}`;

  const weatherHistory: WeatherObservation[] = [];
  const aqHistory: AqObservation[] = [];
  for (let t = -HISTORY_HOURS; t < 0; t++) {
    const w = weatherAt(seedKey, now + t * HOUR, t, locationId, scenario.params, false);
    weatherHistory.push(w);
    aqHistory.push(pollutionAt(locationId, w, scenario.params.fireIntensity));
  }

  const weatherNow = weatherAt(seedKey, now, 0, locationId, scenario.params, true);
  const aqNow = pollutionAt(locationId, weatherNow, scenario.params.fireIntensity);

  const weatherForecast: WeatherObservation[] = [];
  for (let t = 1; t <= FORECAST_HOURS; t++) {
    weatherForecast.push(weatherAt(seedKey, now + t * HOUR, t, locationId, scenario.params, true));
  }

  const forecast = runBaselineForecast({
    location,
    weatherForecast,
    currentPm25: aqNow.pm25,
    fireIntensity: scenario.params.fireIntensity,
  });

  const coupling = computeCoupling(
    couplingInputFromWeather(weatherNow, scenario.params.fireIntensity),
  );

  // Station readings: deterministic offsets from the location baseline
  const rng = makeRng(seedKey + "stations");
  const stations: StationReading[] = STATIONS.map((st) => {
    const stLoc = getLocation(st.locationId);
    const jitter = 0.82 + rng() * 0.42;
    const hotspotBoost = st.id === "st-anand-vihar" ? 1.28 : st.id === "st-ito" ? 1.12 : 1;
    const pm25 = Math.round(
      (locationId === "ncr" ? stLoc.base.pm25 : location.base.pm25) *
        (0.5 + 1.1 * (coupling.accumulationPotential / 100)) *
        jitter *
        hotspotBoost,
    );
    const pm10 = Math.round(pm25 * (stLoc.base.pm10 / stLoc.base.pm25));
    const no2 = Math.round(stLoc.base.no2 * jitter);
    const o3 = Math.round(stLoc.base.o3 * (2 - jitter));
    const aqi = pm25ToAqi(pm25);
    return {
      station: st,
      pm25,
      pm10,
      no2,
      o3,
      aqi,
      category: aqiCategory(aqi).category,
      trend: Math.round(wave(seedKey + st.id, 1, 9)),
      updatedAt: now - Math.round(rng() * 8) * 60_000,
    };
  });

  const episodes = [
    { label: "Post-Diwali stagnation episode", start: "Nov 02 (demo)", hours: 54, peakPm25: 438, driver: "Fire transport + calm winds" },
    { label: "Western-disturbance washout", start: "Nov 09 (demo)", hours: 18, peakPm25: 96, driver: "Rainfall wet deposition" },
    { label: "Thermal inversion build-up", start: "Nov 14 (demo)", hours: 36, peakPm25: 372, driver: "Shallow PBL + low wind" },
  ];

  return {
    generatedAt: now,
    location,
    scenario,
    current: { aq: aqNow, weather: weatherNow, risk: riskFromAqi(aqNow.aqi) },
    weatherHistory,
    weatherForecast,
    aqHistory,
    forecast,
    coupling,
    stations,
    fires: buildFires(scenarioKey, now),
    alerts: buildAlerts(locationId, scenarioKey, forecast, now),
    attribution: buildAttribution(scenarioKey, seedKey),
    health: buildHealth(now),
    episodes,
  };
}

export { LOCATIONS, STATIONS };
