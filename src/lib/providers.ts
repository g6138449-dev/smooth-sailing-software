import { buildDataBundle } from "./engine";
import type { DataBundle, ScenarioKey } from "./types";

/**
 * Provider interfaces — the integration seam for real data.
 *
 * Demo providers below are fully functional today. To go live, implement
 * the same interfaces against real services and swap them in one place:
 *
 *  - AirQualityProvider → CPCB / state-board CAAQMS APIs
 *  - WeatherProvider    → ERA5 / Copernicus CDS, IMD gridded feeds
 *  - FireDataProvider   → NASA FIRMS (VIIRS/MODIS)
 *  - ForecastProvider   → ML model or WRF-Chem-derived product
 *
 * No UI component imports the demo engine directly; everything flows
 * through these interfaces.
 */

export interface DataProvider {
  getBundle(locationId: string, scenario: ScenarioKey, tick: number): Promise<DataBundle>;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class DemoDataProvider implements DataProvider {
  async getBundle(
    locationId: string,
    scenario: ScenarioKey,
    tick: number,
  ): Promise<DataBundle> {
    // Simulate realistic fetch latency so loading states are exercised
    await delay(180);
    return buildDataBundle(locationId, scenario, tick);
  }
}

// Future real providers — same interface:
//
// export class CpcbAirQualityProvider implements AirQualityProvider { ... }
//   endpoint: https://airquality.cpcb.gov.in/... (official feed)
// export class Era5WeatherProvider implements WeatherProvider { ... }
//   endpoint: https://cds.climate.copernicus.eu/api/v2/...
// export class FirmsFireDataProvider implements FireDataProvider { ... }
//   endpoint: https://firms.modaps.eosdis.nasa.gov/api/...

let active: DataProvider = new DemoDataProvider();

export function getDataProvider(): DataProvider {
  return active;
}

export function setDataProvider(p: DataProvider): void {
  active = p;
}
