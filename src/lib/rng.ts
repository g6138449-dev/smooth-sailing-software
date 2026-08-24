/**
 * Deterministic seeded RNG so demo data is realistic, reproducible per
 * (location, scenario, refresh) and never random-noise between renders.
 */
export function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeRng(seedText: string): () => number {
  return mulberry32(hashSeed(seedText));
}

/** Smooth pseudo-noise: deterministic in (seedText, t) */
export function wave(seedText: string, t: number, scale = 1): number {
  const r = makeRng(seedText);
  const a = r() * Math.PI * 2;
  const b = r() * Math.PI * 2;
  const c = r() * Math.PI * 2;
  return (
    (Math.sin(t * 0.9 + a) * 0.5 + Math.sin(t * 0.37 + b) * 0.3 + Math.sin(t * 0.13 + c) * 0.2) *
    scale
  );
}
