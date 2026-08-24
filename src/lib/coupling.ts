import type {
  CouplingAssessment,
  CouplingLink,
  Factor,
  RiskLevel,
  WeatherObservation,
} from "./types";

/**
 * Coupling Intelligence Engine (prototype analytical framework).
 *
 * Translates meteorological drivers into dispersion / accumulation
 * potentials using transparent, inspectable rules. This is NOT a validated
 * atmospheric chemistry model — every rule is documented so a scientific
 * model can replace it later.
 */

const clamp = (v: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, v));

export interface CouplingInput {
  windSpeed: number;
  windDirection: number;
  humidity: number;
  rainfall: number;
  temperature: number;
  pblHeight: number;
  fireIntensity: number; // 0-100
}

export function riskFromAccumulation(acc: number): RiskLevel {
  if (acc < 30) return "LOW";
  if (acc < 50) return "MODERATE";
  if (acc < 65) return "HIGH";
  if (acc < 82) return "VERY HIGH";
  return "SEVERE";
}

export function computeCoupling(input: CouplingInput): CouplingAssessment {
  const windScore = clamp((input.windSpeed / 15) * 100) / 100;
  const pblScore = clamp((input.pblHeight / 1800) * 100) / 100;
  const rainScore = clamp((input.rainfall / 6) * 100) / 100;
  const humidityPenalty = input.humidity > 75 ? 10 : input.humidity > 65 ? 5 : 0;

  const dispersionPotential = Math.round(
    clamp(windScore * 55 + pblScore * 35 + rainScore * 10),
  );
  const accumulationPotential = Math.round(
    clamp(100 - dispersionPotential + humidityPenalty - rainScore * 20),
  );
  const couplingScore = Math.round(
    clamp(
      45 +
        (dispersionPotential < 40 ? 28 : dispersionPotential < 60 ? 12 : 0) +
        (accumulationPotential > 70 ? 18 : accumulationPotential > 50 ? 8 : 0) -
        rainScore * 20,
    ),
  );
  const riskLevel = riskFromAccumulation(accumulationPotential);

  const windDirLabel = degToCompass(input.windDirection);

  const links: CouplingLink[] = [
    {
      id: "wind",
      driver: "Wind Speed",
      driverValue: `${input.windSpeed.toFixed(1)} km/h ${windDirLabel}`,
      mechanism: "Horizontal dispersion",
      effect:
        input.windSpeed < 5
          ? "Poor dispersion potential — pollutants linger near sources"
          : input.windSpeed < 10
            ? "Moderate dispersion — partial ventilation of the basin"
            : "Strong dispersion — pollutants ventilated downwind",
      strength: Math.round(windScore * 100),
      direction: input.windSpeed < 5 ? "worsens" : input.windSpeed < 10 ? "neutral" : "improves",
    },
    {
      id: "pbl",
      driver: "PBL Height",
      driverValue: `${Math.round(input.pblHeight)} m`,
      mechanism: "Vertical mixing volume",
      effect:
        input.pblHeight < 500
          ? "Shallow boundary layer traps pollutants near the surface"
          : input.pblHeight < 1000
            ? "Limited vertical mixing volume"
            : "Deep mixing layer dilutes surface concentrations",
      strength: Math.round(pblScore * 100),
      direction: input.pblHeight < 500 ? "worsens" : input.pblHeight < 1000 ? "neutral" : "improves",
    },
    {
      id: "rain",
      driver: "Rainfall",
      driverValue: `${input.rainfall.toFixed(1)} mm/h`,
      mechanism: "Wet deposition / washout",
      effect:
        input.rainfall > 1
          ? "Active wet deposition removing particulate load"
          : "No wet removal — particles remain airborne",
      strength: Math.round(rainScore * 100),
      direction: input.rainfall > 1 ? "improves" : "worsens",
    },
    {
      id: "humidity",
      driver: "Humidity",
      driverValue: `${Math.round(input.humidity)}%`,
      mechanism: "Hygroscopic particle growth",
      effect:
        input.humidity > 75
          ? "High moisture promotes secondary particle formation & swelling"
          : "Moisture within neutral range for particle behaviour",
      strength: Math.round(clamp(input.humidity)),
      direction: input.humidity > 75 ? "worsens" : "neutral",
    },
    {
      id: "temp",
      driver: "Temperature",
      driverValue: `${input.temperature.toFixed(1)} °C`,
      mechanism: "Atmospheric stability",
      effect:
        input.temperature < 21
          ? "Cool surface air favours stable stratification"
          : input.temperature > 28
            ? "Surface heating promotes convective mixing"
            : "Neutral thermal stratification",
      strength: Math.round(clamp(((32 - input.temperature) / 20) * 100)),
      direction: input.temperature < 21 ? "worsens" : input.temperature > 28 ? "improves" : "neutral",
    },
    {
      id: "fire",
      driver: "Fire Activity",
      driverValue:
        input.fireIntensity > 60
          ? "High upwind activity"
          : input.fireIntensity > 25
            ? "Moderate upwind activity"
            : "Low upwind activity",
      mechanism: "Upwind particulate contribution",
      effect:
        input.fireIntensity > 60
          ? "Strong potential particulate import from upwind fires"
          : input.fireIntensity > 25
            ? "Some upwind particulate contribution possible"
            : "No significant fire-driven import",
      strength: Math.round(clamp(input.fireIntensity)),
      direction: input.fireIntensity > 60 ? "worsens" : input.fireIntensity > 25 ? "neutral" : "improves",
    },
  ];

  const explanations = buildExplanations(input, windDirLabel);
  const chain = buildChain(input, accumulationPotential);

  return {
    dispersionPotential,
    accumulationPotential,
    couplingScore,
    riskLevel,
    links,
    explanations,
    chain,
  };
}

export function buildExplanations(input: CouplingInput, windDirLabel?: string): Factor[] {
  const factors: Factor[] = [];
  const dir = windDirLabel ?? degToCompass(input.windDirection);

  if (input.windSpeed < 5) {
    factors.push({
      key: "wind-low",
      label: "Low wind speed",
      detail: `Wind at ${input.windSpeed.toFixed(1)} km/h (${dir}) is below the 5 km/h ventilation threshold, suppressing horizontal dispersion.`,
      value: `${input.windSpeed.toFixed(1)} km/h`,
      impact: 3,
    });
  } else if (input.windSpeed > 10) {
    factors.push({
      key: "wind-high",
      label: "Strong wind ventilation",
      detail: `Wind at ${input.windSpeed.toFixed(1)} km/h (${dir}) is actively dispersing pollutants out of the basin.`,
      value: `${input.windSpeed.toFixed(1)} km/h`,
      impact: -3,
    });
  }

  if (input.pblHeight < 500) {
    factors.push({
      key: "pbl-low",
      label: "Low atmospheric mixing",
      detail: `Planetary boundary layer at ${Math.round(input.pblHeight)} m sharply limits the vertical volume available for dilution.`,
      value: `${Math.round(input.pblHeight)} m`,
      impact: 3,
    });
  } else if (input.pblHeight < 800) {
    factors.push({
      key: "pbl-mid",
      label: "Restricted mixing layer",
      detail: `PBL height of ${Math.round(input.pblHeight)} m restricts vertical dilution of surface emissions.`,
      value: `${Math.round(input.pblHeight)} m`,
      impact: 1,
    });
  } else if (input.pblHeight > 1200) {
    factors.push({
      key: "pbl-high",
      label: "Deep mixing layer",
      detail: `PBL at ${Math.round(input.pblHeight)} m provides a large dilution volume, lowering surface concentrations.`,
      value: `${Math.round(input.pblHeight)} m`,
      impact: -2,
    });
  }

  if (input.rainfall <= 0.1) {
    factors.push({
      key: "no-rain",
      label: "No rainfall",
      detail: "No wet deposition is occurring, so particles remain airborne longer.",
      value: "0.0 mm/h",
      impact: 1,
    });
  } else {
    factors.push({
      key: "rain",
      label: "Rainfall washout",
      detail: `Rainfall at ${input.rainfall.toFixed(1)} mm/h is actively removing particulates via wet deposition.`,
      value: `${input.rainfall.toFixed(1)} mm/h`,
      impact: -3,
    });
  }

  if (input.humidity > 75) {
    factors.push({
      key: "humidity",
      label: "High humidity",
      detail: `Relative humidity at ${Math.round(input.humidity)}% promotes hygroscopic growth and secondary aerosol formation.`,
      value: `${Math.round(input.humidity)}%`,
      impact: 2,
    });
  }

  if (input.temperature < 20) {
    factors.push({
      key: "temp-low",
      label: "Stable cool boundary layer",
      detail: `Surface temperature of ${input.temperature.toFixed(1)} °C favours stable stratification that suppresses mixing.`,
      value: `${input.temperature.toFixed(1)} °C`,
      impact: 1,
    });
  }

  if (input.fireIntensity > 55) {
    factors.push({
      key: "fire",
      label: "Upwind fire activity",
      detail: "Elevated upwind fire activity may contribute additional transported particulate load.",
      value: `Intensity ${Math.round(input.fireIntensity)}/100`,
      impact: 2,
    });
  }

  // Sort by absolute impact, worst first
  return factors.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
}

function buildChain(
  input: CouplingInput,
  accumulation: number,
): CouplingAssessment["chain"] {
  const bad = input.windSpeed < 5 || input.pblHeight < 500;
  const steps: CouplingAssessment["chain"] = [];

  steps.push({
    step:
      input.windSpeed < 5
        ? `Wind speed ↓ (${input.windSpeed.toFixed(1)} km/h)`
        : `Wind speed ${input.windSpeed >= 10 ? "↑" : "→"} (${input.windSpeed.toFixed(1)} km/h)`,
    tone: input.windSpeed < 5 ? "bad" : input.windSpeed >= 10 ? "good" : "neutral",
  });
  steps.push({
    step:
      input.pblHeight < 500
        ? `PBL height ↓ (${Math.round(input.pblHeight)} m)`
        : `PBL height ${input.pblHeight > 1000 ? "↑" : "→"} (${Math.round(input.pblHeight)} m)`,
    tone: input.pblHeight < 500 ? "bad" : input.pblHeight > 1000 ? "good" : "neutral",
  });
  steps.push({
    step: input.rainfall > 0.5 ? `Rainfall ${input.rainfall.toFixed(1)} mm/h` : "No rainfall",
    tone: input.rainfall > 0.5 ? "good" : "bad",
  });
  steps.push({
    step: bad ? "Dispersion potential ↓" : "Dispersion potential →",
    tone: bad ? "bad" : "neutral",
  });
  steps.push({
    step:
      accumulation > 65
        ? "PM2.5 accumulation ↑"
        : accumulation > 45
          ? "PM2.5 accumulation →"
          : "PM2.5 accumulation ↓",
    tone: accumulation > 65 ? "bad" : accumulation > 45 ? "neutral" : "good",
  });
  steps.push({
    step:
      accumulation > 65 ? "Risk increases" : accumulation > 45 ? "Risk elevated" : "Risk eases",
    tone: accumulation > 65 ? "bad" : accumulation > 45 ? "neutral" : "good",
  });
  return steps;
}

export function degToCompass(deg: number): string {
  const dirs = [
    "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
  ];
  return dirs[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16]!;
}

export function couplingInputFromWeather(
  w: WeatherObservation,
  fireIntensity: number,
): CouplingInput {
  return {
    windSpeed: w.windSpeed,
    windDirection: w.windDirection,
    humidity: w.humidity,
    rainfall: w.rainfall,
    temperature: w.temperature,
    pblHeight: w.pblHeight,
    fireIntensity,
  };
}
