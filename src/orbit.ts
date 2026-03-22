export interface OrbitPath {
  /** Duration of one complete orbit in seconds */
  readonly period: number
  /** Position at elapsed time t (seconds), relative to the orbit's reference point */
  position(t: number): { x: number; y: number }
}
