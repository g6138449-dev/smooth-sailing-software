import { pm25ToAqi, aqiCategory, riskFromAqi, MODEL_VERSION } from "./aqi";
import { computeCoupling, couplingInputFromWeather, buildExplanations } from "./coupling";
import type {
  ForecastPoint,
  NcrLocation,
  WeatherObservation,
} from "./types";

/**
 * Transparent baseline forecasting engine.
 *
 * Input:  historical pollution, weather trajectory, dispersion indicators,
 *         fire-event indicator
 * Output: predicted pollution, risk category, confidence, causal factors
 *
 * Deliberately simple and fully inspectable. A real ML model or a
 * WRF-Chem-derived product can replace `runBaselineForecast` behind the
 * ForecastProvider interface without touching any UI code.
 */

export { MODEL_VERSION };

export interface ForecastInput {
  location: NcrLocation;
  weatherForecast: WeatherObservation[]; // hourly, starting next hour
  currentPm25: number;
  fireIntensity: number; // 0-100
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Diurnal traffic/emission modulation: morning & evening peaks */
function diurnalEmission(hourOfDay: number): number {
  const morning = Math.exp(-Math.pow(hourOfDay - 8.5, 2) / 6);
  const evening = Math.exp(-Math.pow(hourOfDay - 19.5, 2) / 8);
  return 1 + 0.22 * morning + 0.3 * evening;
}

/** Is the fire plume plausibly upwind of NCR under this wind direction? */
function fireTransportFactor(windDirection: number): number {
  // Fires sit NW of NCR (bearing ~300-330). Transport occurs when wind
  // blows FROM the NW quadrant (270-350).
  const d = ((windDirection % 360) + 360) % 360;
  if (d >= 270 && d <= 350) return 1;
  if ((d >= 250 && d < 270) || (d > 350 && d <= 10)) return 0.4;
  return 0.1;
}

export function runBaselineForecast(input: ForecastInput): ForecastPoint[] {
  const { location, weatherForecast, currentPm25, fireIntensity } = input;
  const points: ForecastPoint[] = [];

  for (let h = 0; h < weatherForecast.length; h++) {
    const w = weatherForecast[h]!;
    const horizon = h + 1;
    const hod = new Date(w.timestamp).getHours();

    const coupling = computeCoupling(couplingInputFromWeather(w, fireIntensity));
    const accumulation = coupling.accumulationPotential / 100;

    // Fire influence decays over the horizon and depends on transport path
    const fireDecay = Math.exp(-horizon / 48);
    const transport = fireTransportFactor(w.windDirection);
    const fireContribution = fireIntensity * 0.9 * fireDecay * transport;

    // Base emissions accumulate according to dispersion state
    const accumulationFactor = 0.5 + 1.15 * accumulation;
    let pm25 =
      (location.base.pm25 * 0.45 + currentPm25 * 0.25) *
        accumulationFactor *
        diurnalEmission(hod) +
      fireContribution;

    // Wet deposition removal
    if (w.rainfall > 0.1) {
      pm25 *= 1 - clamp(w.rainfall * 0.1, 0, 0.55);
    }

    pm25 = clamp(pm25, 8, 620);

    const ratio10 = location.base.pm10 / location.base.pm25;
    const pm10 = clamp(pm25 * ratio10 * (1 + 0.05 * Math.sin(h / 6)), 15, 800);
    const no2 = clamp(
      location.base.no2 * (0.6 + 0.5 * accumulation) * diurnalEmission(hod),
      4, 220,
    );
    // Ozone anti-correlates with accumulation (photochemistry + titration)
    const o3 = clamp(
      location.base.o3 * (1.25 - 0.55 * accumulation) *
        (0.4 + 0.9 * Math.max(0, Math.sin((Math.PI * (hod - 6)) / 12))),
      2, 180,
    );

    const aqi = pm25ToAqi(pm25);
    const band = aqiCategory(aqi);

    const confidence = Math.round(
      clamp(
        95 - horizon * 0.45 - (w.stability === "neutral" ? 4 : 0) - (w.rainfall > 0 ? 6 : 0),
        42,
        96,
      ),
    );

    const factors = buildExplanations(
      couplingInputFromWeather(w, fireIntensity * fireDecay),
    );
    if (currentPm25 > 150 && horizon <= 12) {
      factors.push({
        key: "existing-load",
        label: "High existing PM2.5 load",
        detail: `Current concentration of ${Math.round(currentPm25)} µg/m³ means the basin starts from an already polluted state.`,
        value: `${Math.round(currentPm25)} µg/m³`,
        impact: 2,
      });
    }
    if (fireContribution > 15) {
      factors.push({
        key: "fire-transport",
        label: "Upwind fire transport",
        detail: `NW winds align with active fire region; estimated transported contribution ≈ ${Math.round(fireContribution)} µg/m³ (demo).`,
        value: `+${Math.round(fireContribution)} µg/m³`,
        impact: 2,
      });
    }

    points.push({
      horizonHours: horizon,
      timestamp: w.timestamp,
      pm25: Math.round(pm25),
      pm10: Math.round(pm10),
      no2: Math.round(no2),
      o3: Math.round(o3),
      aqi,
      category: band.category,
      risk: riskFromAqi(aqi),
      confidence,
      factors,
    });
  }

  return points;
}

/** Convenience: pick the point nearest to a requested horizon */
export function pointAtHorizon(points: ForecastPoint[], hours: number): ForecastPoint {
  let best = points[0]!;
  for (const p of points) {
    if (Math.abs(p.horizonHours - hours) < Math.abs(best.horizonHours - hours)) best = p;
  }
  return best;
}
