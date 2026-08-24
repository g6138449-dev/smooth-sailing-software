import type { NcrLocation, Station } from "./types";

/**
 * Delhi NCR region registry. Coordinates are real; pollutant baselines are
 * curated demo values in realistic late-autumn NCR ranges.
 */
export const LOCATIONS: NcrLocation[] = [
  {
    id: "ncr",
    name: "Delhi NCR (Regional)",
    short: "NCR",
    lat: 28.61,
    lon: 77.21,
    base: { pm25: 158, pm10: 262, no2: 58, o3: 34, so2: 14, co: 1.4 },
    tempBias: 0,
    humidityBias: 0,
    windBias: 0,
    pblBias: 0,
  },
  {
    id: "delhi",
    name: "Delhi (Central)",
    short: "Delhi",
    lat: 28.6139,
    lon: 77.209,
    base: { pm25: 172, pm10: 285, no2: 64, o3: 31, so2: 13, co: 1.6 },
    tempBias: 0.4,
    humidityBias: -2,
    windBias: -0.6,
    pblBias: -40,
  },
  {
    id: "gurugram",
    name: "Gurugram",
    short: "Gurugram",
    lat: 28.4595,
    lon: 77.0266,
    base: { pm25: 148, pm10: 271, no2: 52, o3: 38, so2: 11, co: 1.2 },
    tempBias: 0.8,
    humidityBias: -4,
    windBias: 0.8,
    pblBias: 60,
  },
  {
    id: "noida",
    name: "Noida",
    short: "Noida",
    lat: 28.5355,
    lon: 77.391,
    base: { pm25: 164, pm10: 256, no2: 55, o3: 33, so2: 12, co: 1.3 },
    tempBias: 0.2,
    humidityBias: 2,
    windBias: 0.2,
    pblBias: 20,
  },
  {
    id: "ghaziabad",
    name: "Ghaziabad",
    short: "Ghaziabad",
    lat: 28.6692,
    lon: 77.4538,
    base: { pm25: 178, pm10: 289, no2: 61, o3: 29, so2: 15, co: 1.5 },
    tempBias: 0.1,
    humidityBias: 3,
    windBias: -0.4,
    pblBias: -30,
  },
  {
    id: "faridabad",
    name: "Faridabad",
    short: "Faridabad",
    lat: 28.4089,
    lon: 77.3178,
    base: { pm25: 166, pm10: 298, no2: 57, o3: 30, so2: 16, co: 1.4 },
    tempBias: 0.3,
    humidityBias: -1,
    windBias: 0.1,
    pblBias: -10,
  },
];

export const STATIONS: Station[] = [
  { id: "st-anand-vihar", name: "Anand Vihar", locationId: "delhi", lat: 28.6469, lon: 77.3161, agency: "DPCC (demo)" },
  { id: "st-rk-puram", name: "RK Puram", locationId: "delhi", lat: 28.566, lon: 77.1767, agency: "CPCB (demo)" },
  { id: "st-punjabi-bagh", name: "Punjabi Bagh", locationId: "delhi", lat: 28.6683, lon: 77.1167, agency: "CPCB (demo)" },
  { id: "st-ito", name: "ITO", locationId: "delhi", lat: 28.6289, lon: 77.241, agency: "CPCB (demo)" },
  { id: "st-dwarka", name: "Dwarka Sec-8", locationId: "delhi", lat: 28.5921, lon: 77.046, agency: "DPCC (demo)" },
  { id: "st-rohini", name: "Rohini", locationId: "delhi", lat: 28.7041, lon: 77.1125, agency: "DPCC (demo)" },
  { id: "st-gnoida", name: "Greater Noida", locationId: "noida", lat: 28.4744, lon: 77.504, agency: "UPPCB (demo)" },
  { id: "st-noida", name: "Noida Sec-62", locationId: "noida", lat: 28.628, lon: 77.3649, agency: "UPPCB (demo)" },
  { id: "st-gurugram", name: "Gurugram Sec-51", locationId: "gurugram", lat: 28.4235, lon: 77.0651, agency: "HSPCB (demo)" },
  { id: "st-faridabad", name: "Faridabad NIT", locationId: "faridabad", lat: 28.3852, lon: 77.3025, agency: "HSPCB (demo)" },
];

export function getLocation(id: string): NcrLocation {
  return LOCATIONS.find((l) => l.id === id) ?? LOCATIONS[0]!;
}
