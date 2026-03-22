/**
 * Orbital data for the classical planets.
 *
 * Keplerian elements from J2000 epoch (NASA/JPL).
 * Ptolemaic elements from the Almagest, converted to AU:
 *   - Outer planets (Mars, Jupiter, Saturn): Almagest deferent = 60 parts = planet's a
 *   - Inner planets (Mercury, Venus) + Sun:  Almagest deferent = 60 parts = 1 AU
 *
 * All periods in simulation seconds. SECONDS_PER_YEAR = 1 means 1 sim-second = 1 real year.
 */

export const SECONDS_PER_YEAR = 9

// ---------------------------------------------------------------------------
// Kepler
// ---------------------------------------------------------------------------

export interface KeplerData {
  a: number  // semi-major axis (AU)
  e: number  // eccentricity
  T: number  // period (simulation seconds)
}

export const KEPLER: Record<string, KeplerData> = {
  mercury: { a: 0.3871, e: 0.2056, T: 0.2408 * SECONDS_PER_YEAR },
  venus:   { a: 0.7233, e: 0.0068, T: 0.6152 * SECONDS_PER_YEAR },
  earth:   { a: 1.0000, e: 0.0167, T: 1.0000 * SECONDS_PER_YEAR },
  mars:    { a: 1.5237, e: 0.0934, T: 1.8809 * SECONDS_PER_YEAR },
  jupiter: { a: 5.2029, e: 0.0484, T: 11.862 * SECONDS_PER_YEAR },
  saturn:  { a: 9.5367, e: 0.0539, T: 29.457 * SECONDS_PER_YEAR },
}

// ---------------------------------------------------------------------------
// Ptolemy — standard deferent + epicycle + eccentric + equant
// ---------------------------------------------------------------------------

export interface PtolemyData {
  R: number       // deferent radius (AU)
  r: number       // epicycle radius (AU)
  e: number       // eccentric offset: Earth → deferent center (AU)
  equant: number  // equant distance from Earth (AU); bisected: equant = 2e
  T_d: number     // deferent period (simulation seconds)
  T_e: number     // epicycle period (simulation seconds)
  phase: number   // initial equant angle (radians); π = start at perihelion
  epicyclePhase?: number  // initial epicycle angle (radians); computed at runtime
  samplePeriod: number  // seconds to sample for the orbit path graphic
}

export const PTOLEMY: Record<string, PtolemyData> = {
  // Sun: simple eccentric, no epicycle (r=0)
  sun: {
    R: 1.0000, r: 0,
    e: 0.0167, equant: 0.0334,
    T_d: 1.0 * SECONDS_PER_YEAR, T_e: 1.0 * SECONDS_PER_YEAR,
    phase: Math.PI,
    samplePeriod: 1.0 * SECONDS_PER_YEAR,
  },

  // Venus — inner planet: deferent tracks Sun (T_d = 1 yr), epicycle = Venus orbit
  // Almagest: epicycle = 43:10 = 43.167 parts → 0.7194 AU; eccentricity = 1:15 = 1.25 parts
  venus: {
    R: 1.0000, r: 43.167 / 60,
    e: 1.25 / 60, equant: 2.5 / 60,
    T_d: 1.0 * SECONDS_PER_YEAR, T_e: 0.6152 * SECONDS_PER_YEAR,
    phase: Math.PI,
    samplePeriod: 8.0 * SECONDS_PER_YEAR,
  },

  // Mars — outer planet: deferent = Mars orbit, epicycle ≈ Earth's orbit
  // Almagest: epicycle = 39:30 = 39.5 parts; full eccentricity = 12:00 = 12 parts
  mars: {
    R: 1.5237, r: 1.5237 * 39.5 / 60,
    e: 1.5237 * 6.0 / 60, equant: 1.5237 * 12.0 / 60,
    T_d: 1.8809 * SECONDS_PER_YEAR, T_e: 1.0 * SECONDS_PER_YEAR,
    phase: Math.PI,
    samplePeriod: 6.0 * SECONDS_PER_YEAR,
  },

  // Jupiter — outer planet
  // Almagest: epicycle = 11:30 = 11.5 parts; full eccentricity = 5:30 = 5.5 parts
  jupiter: {
    R: 5.2029, r: 5.2029 * 11.5 / 60,
    e: 5.2029 * 2.75 / 60, equant: 5.2029 * 5.5 / 60,
    T_d: 11.862 * SECONDS_PER_YEAR, T_e: 1.0 * SECONDS_PER_YEAR,
    phase: Math.PI,
    samplePeriod: 12.0 * SECONDS_PER_YEAR,
  },

  // Saturn — outer planet
  // Almagest: epicycle = 6:32 = 6.533 parts; full eccentricity = 6:50 = 6.833 parts
  saturn: {
    R: 9.5367, r: 9.5367 * 6.533 / 60,
    e: 9.5367 * 3.417 / 60, equant: 9.5367 * 6.833 / 60,
    T_d: 29.457 * SECONDS_PER_YEAR, T_e: 1.0 * SECONDS_PER_YEAR,
    phase: Math.PI,
    samplePeriod: 30.0 * SECONDS_PER_YEAR,
  },
}

// ---------------------------------------------------------------------------
// Ptolemy — Mercury crank model (separate params)
// ---------------------------------------------------------------------------

export interface MercuryPtolemyData {
  R: number       // deferent radius (AU)
  r: number       // epicycle radius (AU)
  e: number       // eccentric offset to mean center (AU); equant = 2e
  T_d: number     // deferent period (simulation seconds)
  T_e: number     // epicycle period (simulation seconds)
  phase: number
  epicyclePhase?: number  // initial epicycle angle (radians); computed at runtime
  samplePeriod: number
}

// Almagest: epicycle = 22:30 = 22.5 parts; eccentric = 3:00 = 3 parts
export const MERCURY_PTOLEMY: MercuryPtolemyData = {
  R: 1.0000, r: 22.5 / 60,
  e: 3.0 / 60,
  T_d: 1.0 * SECONDS_PER_YEAR, T_e: 0.2408 * SECONDS_PER_YEAR,
  phase: Math.PI,
  samplePeriod: 3.0 * SECONDS_PER_YEAR,
}

// ---------------------------------------------------------------------------
// Display — colours and sizes
// ---------------------------------------------------------------------------

export interface PlanetStyle {
  keplerColor: number
  ptolemyColor: number
  keplerOrbitColor: number
  ptolemyOrbitColor: number
  bodyRadius: number
  glowRadius?: number
}

export const STYLES: Record<string, PlanetStyle> = {
  sun:     { keplerColor: 0xffe066, ptolemyColor: 0xff9900, keplerOrbitColor: 0x1a3355, ptolemyOrbitColor: 0x553300, bodyRadius: 10, glowRadius: 18 },
  mercury: { keplerColor: 0xbbbbbb, ptolemyColor: 0xffaa55, keplerOrbitColor: 0x1a3355, ptolemyOrbitColor: 0x553300, bodyRadius: 3 },
  venus:   { keplerColor: 0xffeeaa, ptolemyColor: 0xffaa33, keplerOrbitColor: 0x1a3355, ptolemyOrbitColor: 0x553300, bodyRadius: 4 },
  earth:   { keplerColor: 0x4488ff, ptolemyColor: 0x4488ff, keplerOrbitColor: 0x1a3355, ptolemyOrbitColor: 0x553300, bodyRadius: 4 },
  mars:    { keplerColor: 0xff4422, ptolemyColor: 0xff8844, keplerOrbitColor: 0x1a3355, ptolemyOrbitColor: 0x553300, bodyRadius: 4 },
  jupiter: { keplerColor: 0xff9944, ptolemyColor: 0xffbb33, keplerOrbitColor: 0x1a3355, ptolemyOrbitColor: 0x553300, bodyRadius: 6 },
  saturn:  { keplerColor: 0xffcc44, ptolemyColor: 0xffee88, keplerOrbitColor: 0x1a3355, ptolemyOrbitColor: 0x553300, bodyRadius: 5 },
}
