/**
 * AeroCast NCR — domain models.
 * These types mirror the future database schema (db/schema.sql) so that
 * demo providers and real providers (CPCB / ERA5 / NASA FIRMS) stay
 * interchangeable without redesigning the UI.
 */

export type PollutantKey = "pm25" | "pm10" | "no2" | "o3" | "so2" | "co";

export type ScenarioKey =
  | "normal"
  | "spike"
  | "stagnation"
  | "fire"
  | "rainfall";

export type AqiCategory =
  | "Good"
  | "Moderate"
  | "Poor"
  | "Very Poor"
  | "Severe";

export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "VERY HIGH" | "SEVERE";

export type AlertSeverity = "info" | "watch" | "warning" | "severe";
export type AlertStatus = "active" | "acknowledged" | "dismissed" | "reviewed";

export type TimeRangeKey = "6h" | "24h" | "48h" | "72h";

export type UserRole =
  | "administrator"
  | "analyst"
  | "officer"
  | "researcher"
  | "public";

export interface NcrLocation {
  id: string;
  name: string;
  short: string;
  lat: number;
  lon: number;
  /** Demo baseline pollutant levels for this location */
  base: Record<PollutantKey, number>;
  /** Weather micro-adjustments relative to regional mean */
  tempBias: number;
  humidityBias: number;
  windBias: number;
  pblBias: number;
}

export interface Station {
  id: string;
  name: string;
  locationId: string;
  lat: number;
  lon: number;
  agency: string;
}

export interface WeatherObservation {
  timestamp: number;
  temperature: number; // °C
  humidity: number; // %
  windSpeed: number; // km/h
  windDirection: number; // degrees FROM which wind blows
  rainfall: number; // mm in hour
  pressure: number; // hPa
  solarRadiation: number; // W/m²
  pblHeight: number; // m
  stability: "stable" | "neutral" | "unstable";
}

export type AqObservation = Record<PollutantKey, number> & {
  timestamp: number;
  aqi: number;
  category: AqiCategory;
};

export interface Factor {
  key: string;
  label: string;
  detail: string;
  value: string;
  /** positive = pushes pollution up, negative = helps disperse */
  impact: number;
}

export interface ForecastPoint {
  horizonHours: number;
  timestamp: number;
  pm25: number;
  pm10: number;
  no2: number;
  o3: number;
  aqi: number;
  category: AqiCategory;
  risk: RiskLevel;
  confidence: number; // 0-100
  factors: Factor[];
}

export interface CouplingLink {
  id: string;
  driver: string;
  driverValue: string;
  mechanism: string;
  effect: string;
  strength: number; // 0-100
  direction: "worsens" | "improves" | "neutral";
}

export interface CouplingAssessment {
  dispersionPotential: number; // 0-100
  accumulationPotential: number; // 0-100
  couplingScore: number; // 0-100 (higher = weather more strongly controls pollution)
  riskLevel: RiskLevel;
  links: CouplingLink[];
  explanations: Factor[];
  chain: { step: string; tone: "bad" | "good" | "neutral" }[];
}

export interface FireEvent {
  id: string;
  name: string;
  lat: number;
  lon: number;
  detectedAt: number;
  /** Fire Radiative Power proxy, MW (demo) */
  intensity: number;
  distanceKm: number;
  bearingFromNcr: number; // degrees
}

export interface AlertItem {
  id: string;
  severity: AlertSeverity;
  title: string;
  locationId: string;
  region: string;
  issuedAt: number;
  expectedInHours: number;
  pollutant: PollutantKey;
  currentValue: number;
  predictedValue: number;
  risk: RiskLevel;
  reason: string;
  recommendations: string[];
  status: AlertStatus;
}

export interface SourceContribution {
  key: string;
  label: string;
  pct: number;
  trend: number; // pct change vs previous day
  color: string;
  explanation: string;
  affected: string[];
}

export interface DataSourceStatus {
  id: string;
  name: string;
  kind: "air-quality" | "weather" | "fire" | "forecast";
  mode: "demo" | "live";
  status: "operational" | "degraded" | "offline";
  lastUpdate: number;
  completeness: number; // pct
  missingCount: number;
  note: string;
}

export interface StationReading {
  station: Station;
  pm25: number;
  pm10: number;
  no2: number;
  o3: number;
  aqi: number;
  category: AqiCategory;
  trend: number; // pct hourly change
  updatedAt: number;
}

export interface ScenarioParams {
  windSpeed: number; // km/h
  windDirection: number; // deg
  temperature: number; // °C
  humidity: number; // %
  rainfall: number; // mm/h
  pblHeight: number; // m
  fireIntensity: number; // 0-100
}

export interface ScenarioDefinition {
  key: ScenarioKey;
  name: string;
  description: string;
  params: ScenarioParams;
}

export interface DataBundle {
  generatedAt: number;
  location: NcrLocation;
  scenario: ScenarioDefinition;
  current: {
    aq: AqObservation;
    weather: WeatherObservation;
    risk: RiskLevel;
  };
  weatherHistory: WeatherObservation[];
  weatherForecast: WeatherObservation[];
  aqHistory: AqObservation[];
  forecast: ForecastPoint[];
  coupling: CouplingAssessment;
  stations: StationReading[];
  fires: FireEvent[];
  alerts: AlertItem[];
  attribution: SourceContribution[];
  health: DataSourceStatus[];
  episodes: {
    label: string;
    start: string;
    hours: number;
    peakPm25: number;
    driver: string;
  }[];
}
