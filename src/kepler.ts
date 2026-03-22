import type { OrbitPath } from './orbit'

/** Solve Kepler's equation M = E - e·sin(E) for eccentric anomaly E via Newton-Raphson. */
function solveKepler(M: number, e: number, iterations = 8): number {
  let E = M
  for (let i = 0; i < iterations; i++) {
    E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E))
  }
  return E
}

export interface KeplerParams {
  a: number  // semi-major axis
  e: number  // orbital eccentricity (0 = circle)
  T: number  // orbital period (seconds)
}

/**
 * Keplerian elliptical orbit. position(t) is measured from the occupied focus
 * (the Sun/attractor). Ellipse center lies at (+c, 0) from the focus.
 */
export class KeplerOrbit implements OrbitPath {
  readonly a: number
  readonly b: number
  readonly c: number
  readonly e: number
  readonly period: number

  constructor({ a, e, T }: KeplerParams) {
    this.a = a
    this.e = e
    this.b = a * Math.sqrt(1 - e * e)
    this.c = a * e
    this.period = T
  }

  position(t: number): { x: number; y: number } {
    const M = ((2 * Math.PI * t) / this.period) % (2 * Math.PI)
    const E = solveKepler(M, this.e)
    return {
      x: this.a * Math.cos(E) - this.c,  // relative to focus
      y: this.b * Math.sin(E),
    }
  }
}
