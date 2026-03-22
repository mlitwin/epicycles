/**
 * Solve Kepler's equation M = E - e*sin(E) for eccentric anomaly E
 * using Newton-Raphson iteration.
 */
export function solveKepler(M: number, e: number, iterations = 8): number {
  let E = M
  for (let i = 0; i < iterations; i++) {
    E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E))
  }
  return E
}

/**
 * Given eccentric anomaly E and orbital parameters, return position
 * relative to the ellipse center.
 */
export function eccentricAnomalyToPosition(
  E: number,
  a: number,
  b: number
): { x: number; y: number } {
  return {
    x: a * Math.cos(E),
    y: b * Math.sin(E),
  }
}
