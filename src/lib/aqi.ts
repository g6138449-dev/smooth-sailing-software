import type { AqiCategory, PollutantKey, RiskLevel } from "./types";

/**
 * Indian National AQI sub-index breakpoints (simplified for PM2.5/PM10)
 * and category metadata. Used consistently across all views so colors and
 * labels never diverge.
 */

export interface AqiBand {
  category: AqiCategory;
  min: number;
  max: number;
  color: string; // hex mirrors of CSS tokens for chart/SVG fills
  token: string; // tailwind token suffix
  advice: string;
}

export const AQI_BANDS: AqiBand[] = [
  {
    category: "Good",
    min: 0,
    max: 100,
    color: "#34d17b",
    token: "aqi-good",
    advice: "Air quality acceptable for outdoor activity.",
  },
  {
    category: "Moderate",
    min: 101,
    max: 200,
    color: "#e5c04b",
    token: "aqi-moderate",
    advice: "Sensitive groups should reduce prolonged exertion.",
  },
  {
    category: "Poor",
    min: 201,
    max: 300,
    color: "#f08a3c",
    token: "aqi-poor",
    advice: "Breathing discomfort possible on prolonged exposure.",
  },
  {
    category: "Very Poor",
    min: 301,
    max: 400,
    color: "#e35d4f",
    token: "aqi-very-poor",
    advice: "Respiratory illness risk on prolonged exposure.",
  },
  {
    category: "Severe",
    min: 401,
    max: 600,
    color: "#a03428",
    token: "aqi-severe",
    advice: "Serious health effects; avoid outdoor exposure.",
  },
];

export function aqiCategory(aqi: number): AqiBand {
  for (const band of AQI_BANDS) {
    if (aqi <= band.max) return band;
  }
  return AQI_BANDS[AQI_BANDS.length - 1]!;
}

export function categoryColor(category: AqiCategory): string {
  return AQI_BANDS.find((b) => b.category === category)?.color ?? "#e35d4f";
}

/** PM2.5 (µg/m³) → simplified Indian AQI sub-index */
export function pm25ToAqi(pm25: number): number {
  const bp: [number, number, number, number][] = [
    [0, 30, 0, 50],
    [31, 60, 51, 100],
    [61, 90, 101, 200],
    [91, 120, 201, 300],
    [121, 250, 301, 400],
    [251, 500, 401, 500],
  ];
  for (const [cLo, cHi, aLo, aHi] of bp) {
    if (pm25 <= cHi) {
      const t = (pm25 - cLo) / (cHi - cLo || 1);
      return Math.round(aLo + t * (aHi - aLo));
    }
  }
  return 500;
}

export function riskFromAqi(aqi: number): RiskLevel {
  if (aqi <= 100) return "LOW";
  if (aqi <= 200) return "MODERATE";
  if (aqi <= 300) return "HIGH";
  if (aqi <= 400) return "VERY HIGH";
  return "SEVERE";
}

export function riskTone(risk: RiskLevel): AqiCategory {
  switch (risk) {
    case "LOW":
      return "Good";
    case "MODERATE":
      return "Moderate";
    case "HIGH":
      return "Poor";
    case "VERY HIGH":
      return "Very Poor";
    case "SEVERE":
      return "Severe";
  }
}

export interface PollutantMeta {
  key: PollutantKey;
  label: string;
  unit: string;
  threshold: number; // 24h guideline-ish demo threshold
  description: string;
}

export const POLLUTANTS: PollutantMeta[] = [
  {
    key: "pm25",
    label: "PM2.5",
    unit: "µg/m³",
    threshold: 60,
    description: "Fine particulate matter — penetrates deep into lungs.",
  },
  {
    key: "pm10",
    label: "PM10",
    unit: "µg/m³",
    threshold: 100,
    description: "Coarse particulate matter — dust, pollen, construction.",
  },
  {
    key: "no2",
    label: "NO₂",
    unit: "µg/m³",
    threshold: 80,
    description: "Nitrogen dioxide — traffic and combustion marker.",
  },
  {
    key: "o3",
    label: "O₃",
    unit: "µg/m³",
    threshold: 100,
    description: "Ground-level ozone — photochemical secondary pollutant.",
  },
  {
    key: "so2",
    label: "SO₂",
    unit: "µg/m³",
    threshold: 80,
    description: "Sulphur dioxide — industrial and coal combustion marker.",
  },
  {
    key: "co",
    label: "CO",
    unit: "mg/m³",
    threshold: 2,
    description: "Carbon monoxide — incomplete combustion marker.",
  },
];

export function pollutantMeta(key: PollutantKey): PollutantMeta {
  return POLLUTANTS.find((p) => p.key === key)!;
}

export const SEVERITY_META: Record<
  string,
  { label: string; color: string; token: string }
> = {
  info: { label: "INFO", color: "#6fb3e8", token: "sev-info" },
  watch: { label: "WATCH", color: "#e5c04b", token: "sev-watch" },
  warning: { label: "WARNING", color: "#f08a3c", token: "sev-warning" },
  severe: { label: "SEVERE", color: "#e35d4f", token: "sev-severe" },
};

export const MODEL_VERSION = "Prototype Baseline v0.1";

export const TIME_RANGES = [
  { key: "6h", label: "Last 6 hours", hours: 6 },
  { key: "24h", label: "Last 24 hours", hours: 24 },
  { key: "48h", label: "Last 48 hours", hours: 48 },
  { key: "72h", label: "Last 72 hours", hours: 72 },
] as const;
