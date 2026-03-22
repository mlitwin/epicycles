import type { OrbitPath } from './orbit'

export interface Body {
  readonly name: string
  worldPosition(t: number): { x: number; y: number }
}

/** A body fixed at a point in the inertial frame (e.g. the Sun). */
export class FixedBody implements Body {
  readonly name: string
  private readonly pos: { x: number; y: number }

  constructor(name: string, pos: { x: number; y: number } = { x: 0, y: 0 }) {
    this.name = name
    this.pos = pos
  }

  worldPosition(_t: number): { x: number; y: number } {
    return { ...this.pos }
  }
}

/** A body that follows an OrbitPath relative to a parent body. */
export class OrbitalBody implements Body {
  readonly name: string
  readonly orbit: OrbitPath
  private readonly parent: Body

  constructor(name: string, parent: Body, orbit: OrbitPath) {
    this.name = name
    this.parent = parent
    this.orbit = orbit
  }

  worldPosition(t: number): { x: number; y: number } {
    const p = this.parent.worldPosition(t)
    const o = this.orbit.position(t)
    return { x: p.x + o.x, y: p.y + o.y }
  }
}
