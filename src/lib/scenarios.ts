import type { ScenarioDefinition, ScenarioKey } from "./types";

/**
 * Hackathon Demo Mode scenarios. Selecting one re-parameterises the ENTIRE
 * demo data engine — weather, pollution, forecast, coupling, alerts, map —
 * so the judge demo is consistent across every page.
 */
export const SCENARIOS: ScenarioDefinition[] = [
  {
    key: "normal",
    name: "Normal Conditions",
    description: "Typical late-autumn day: moderate winds, moderate pollution.",
    params: {
      windSpeed: 8.5,
      windDirection: 315,
      temperature: 26,
      humidity: 55,
      rainfall: 0,
      pblHeight: 950,
      fireIntensity: 15,
    },
  },
  {
    key: "spike",
    name: "Pollution Spike",
    description: "Sharp emission-driven spike on top of marginal dispersion.",
    params: {
      windSpeed: 5,
      windDirection: 300,
      temperature: 22,
      humidity: 68,
      rainfall: 0,
      pblHeight: 620,
      fireIntensity: 35,
    },
  },
  {
    key: "stagnation",
    name: "Stagnant Atmosphere",
    description: "Calm winds + shallow boundary layer → severe accumulation.",
    params: {
      windSpeed: 3,
      windDirection: 290,
      temperature: 19,
      humidity: 82,
      rainfall: 0,
      pblHeight: 380,
      fireIntensity: 40,
    },
  },
  {
    key: "fire",
    name: "Upwind Stubble Burning",
    description: "Active Punjab/Haryana fire hotspots with NW transport winds.",
    params: {
      windSpeed: 9,
      windDirection: 320,
      temperature: 24,
      humidity: 48,
      rainfall: 0,
      pblHeight: 800,
      fireIntensity: 85,
    },
  },
  {
    key: "rainfall",
    name: "Rainfall Washout",
    description: "Rain band over NCR — wet deposition removes particulates.",
    params: {
      windSpeed: 11,
      windDirection: 120,
      temperature: 21,
      humidity: 90,
      rainfall: 4.2,
      pblHeight: 1100,
      fireIntensity: 5,
    },
  },
];

export function getScenario(key: ScenarioKey): ScenarioDefinition {
  return SCENARIOS.find((s) => s.key === key) ?? SCENARIOS[0]!;
}
