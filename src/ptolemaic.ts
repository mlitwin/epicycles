import type { OrbitPath } from './orbit'

export interface PtolemaicParams {
  R: number       // deferent radius (Earth → epicycle center, mean distance)
  r: number       // epicycle radius (0 = no epicycle)
  e: number       // eccentric: distance from Earth to center of deferent
  equant: number  // distance from Earth to equant point, along eccentric direction
                  //   0        → equant at Earth (simple deferent, uniform from Earth)
                  //   e        → equant at eccentric center (uniform from center, no equant effect)
                  //   2*e      → bisected eccentricity (standard Ptolemaic)
  T_d: number     // deferent period (s): time for the equant angle to complete 2π
  T_e: number     // epicycle period (s): planet's revolution on epicycle (negative = clockwise)
  phase?: number  // initial equant angle offset (radians, default 0)
                  //   Math.PI → start at perigee (use to align with Kepler's E=0)
  epicyclePhase?: number  // initial epicycle angle offset (radians, default 0)
  period?: number // full path closing period; defaults to approx lcm(T_d, |T_e|)
}

/**
 * Ptolemaic orbit: deferent + epicycle + eccentric + equant.
 *
 * All positions are relative to Earth at the origin.
 *
 * Geometry:
 *   O = (0, 0)          Earth
 *   C = (e, 0)          eccentric (center of deferent)
 *   Q = (equant, 0)     equant point
 *   K on deferent       |K − C| = R, angle ∠(Q→K) grows uniformly
 *   P = K + r·(cosφ, sinφ)  planet on epicycle
 *
 * Derivation of K given equant angle θ:
 *   K = Q + s·(cosθ, sinθ),  where |K − C|² = R²
 *   Let Δ = equant − e
 *   (Δ + s·cosθ)² + (s·sinθ)² = R²
 *   s² + 2Δ·s·cosθ + Δ² − R² = 0
 *   s = −Δ·cosθ + √(R² − Δ²·sin²θ)     (positive root = near side)
 */
export class PtolemaicOrbit implements OrbitPath {
  readonly period: number

  private readonly R: number
  private readonly r: number
  private readonly e: number
  private readonly equant: number
  private readonly Δ: number   // equant − e
  private readonly T_d: number
  private readonly T_e: number
  private readonly phase: number
  private readonly epicyclePhase: number

  constructor(params: PtolemaicParams) {
    this.R = params.R
    this.r = params.r
    this.e = params.e
    this.equant = params.equant
    this.Δ = params.equant - params.e
    this.T_d = params.T_d
    this.T_e = params.T_e
    this.phase = params.phase ?? 0
    this.epicyclePhase = params.epicyclePhase ?? 0
    this.period = params.period ?? approxLcm(Math.abs(params.T_d), Math.abs(params.T_e))
  }

  position(t: number): { x: number; y: number } {
    // --- Epicycle center K ---
    const θ = (2 * Math.PI * t) / this.T_d + this.phase  // equant angle, uniform in t

    // s = distance from Q to K along ray at θ
    const s = -this.Δ * Math.cos(θ) + Math.sqrt(this.R ** 2 - this.Δ ** 2 * Math.sin(θ) ** 2)
    const Kx = this.equant + s * Math.cos(θ)
    const Ky = s * Math.sin(θ)

    // --- Planet on epicycle ---
    const φ = (2 * Math.PI * t) / this.T_e + this.epicyclePhase
    return {
      x: Kx + this.r * Math.cos(φ),
      y: Ky + this.r * Math.sin(φ),
    }
  }
}

/** Approximate LCM for (nearly) integer or rational periods. */
function approxLcm(a: number, b: number): number {
  if (b < 1e-9) return a
  function gcd(x: number, y: number): number {
    return y < 1e-9 ? x : gcd(y, x % y)
  }
  return (a * b) / gcd(a, b)
}

export interface MercuryParams {
  R: number       // deferent radius
  r: number       // epicycle radius
  e: number       // eccentric offset: Earth → mean center M=(e,0); equant Q=(2e,0)
  T_d: number     // deferent period (s)
  T_e: number     // epicycle period (s)
  phase?: number
  epicyclePhase?: number
  period?: number
}

/**
 * Ptolemy's Mercury model with the "crank" mechanism.
 *
 * The deferent center C is not fixed but oscillates on a circle of radius e
 * around the mean center M = (e, 0):
 *   C(t) = e·(1 + cos(2θ),  sin(2θ))
 *
 * This makes |Earth→C| = 2e|cosθ|, varying between 0 (at quadrature)
 * and 2e (at apsides) — giving Mercury its anomalously large eccentricity variation.
 *
 * The quadratic for K (epicycle center on deferent) simplifies to:
 *   s = √(R² − 4e²sin²θ)
 *   K = (2e + s·cosθ,  s·sinθ)
 *
 * Derivation: the cross-term in the quadratic vanishes because
 *   (Q−C)·(cosθ, sinθ) = 0  for all θ  (Q = (2e,0), C as above).
 */
export class MercuryOrbit implements OrbitPath {
  readonly period: number
  private readonly R: number
  private readonly r: number
  private readonly e: number
  private readonly T_d: number
  private readonly T_e: number
  private readonly phase: number
  private readonly epicyclePhase: number

  constructor(params: MercuryParams) {
    this.R = params.R
    this.r = params.r
    this.e = params.e
    this.T_d = params.T_d
    this.T_e = params.T_e
    this.phase = params.phase ?? 0
    this.epicyclePhase = params.epicyclePhase ?? 0
    this.period = params.period ?? approxLcm(Math.abs(params.T_d), Math.abs(params.T_e))
  }

  position(t: number): { x: number; y: number } {
    const θ = (2 * Math.PI * t) / this.T_d + this.phase

    // Epicycle center K on deferent; crank eliminates the cross-term
    const s = Math.sqrt(Math.max(0, this.R ** 2 - 4 * this.e ** 2 * Math.sin(θ) ** 2))
    const Kx = 2 * this.e + s * Math.cos(θ)
    const Ky = s * Math.sin(θ)

    const φ = (2 * Math.PI * t) / this.T_e + this.epicyclePhase
    return {
      x: Kx + this.r * Math.cos(φ),
      y: Ky + this.r * Math.sin(φ),
    }
  }
}
