import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import type { Body } from './body'
import { OrbitalBody } from './body'
import type { SceneTransform } from './transform'
import { IdentityTransform } from './transform'

export interface PlanetOptions {
  color: number
  radius: number
  label?: string
  orbitColor?: number
  showOrbitPath?: boolean
  showRadiusVector?: boolean
  glowRadius?: number
  /** Period (seconds) used to sample the orbit path. Defaults to the body's orbital period. */
  samplePeriod?: number
  /** Number of points used to sample the orbit path. Default 512. */
  orbitSamples?: number
  /** Coordinate transform applied to all positions (AU → screen px). Default: identity. */
  transform?: SceneTransform
}

export class Planet {
  private readonly body: Body
  private reference: Body
  private readonly samplePeriod: number
  private readonly orbitSamples: number
  private readonly showOrbitPath: boolean
  private readonly showRadiusVector: boolean
  private readonly transform: SceneTransform

  private readonly orbitPathGraphic: Graphics
  private readonly radiusVector: Graphics
  private readonly glowGraphic: Graphics | null
  private readonly bodyGraphic: Graphics
  private readonly labelText: Text | null

  constructor(scene: Container, body: Body, reference: Body, options: PlanetOptions) {
    const {
      color,
      radius,
      label,
      orbitColor = 0x223355,
      showOrbitPath = true,
      showRadiusVector = false,
      glowRadius,
      samplePeriod,
      orbitSamples = 512,
      transform,
    } = options

    this.body = body
    this.reference = reference
    this.showOrbitPath = showOrbitPath
    this.showRadiusVector = showRadiusVector
    this.orbitSamples = orbitSamples
    this.transform = transform ?? new IdentityTransform()
    this.samplePeriod = samplePeriod ?? (body instanceof OrbitalBody ? body.orbit.period : 10)

    this.orbitPathGraphic = new Graphics()
    scene.addChild(this.orbitPathGraphic)

    this.radiusVector = new Graphics()
    scene.addChild(this.radiusVector)

    if (glowRadius != null) {
      this.glowGraphic = new Graphics()
      this.glowGraphic.circle(0, 0, glowRadius)
      this.glowGraphic.fill({ color, alpha: 0.15 })
      scene.addChild(this.glowGraphic)
    } else {
      this.glowGraphic = null
    }

    this.bodyGraphic = new Graphics()
    this.bodyGraphic.circle(0, 0, radius)
    this.bodyGraphic.fill(color)
    scene.addChild(this.bodyGraphic)

    if (label) {
      const style = new TextStyle({ fill: 0x8899bb, fontSize: 11, fontFamily: 'monospace' })
      this.labelText = new Text({ text: label, style })
      scene.addChild(this.labelText)
    } else {
      this.labelText = null
    }

    if (showOrbitPath) this.rebuildOrbitPath()
  }

  setReference(ref: Body): void {
    this.reference = ref
    if (this.showOrbitPath) this.rebuildOrbitPath()
  }

  update(t: number): void {
    const world = this.body.worldPosition(t)
    const ref = this.reference.worldPosition(t)
    const { x: sx, y: sy } = this.transform.apply(world.x - ref.x, world.y - ref.y)

    this.bodyGraphic.x = sx
    this.bodyGraphic.y = sy

    if (this.glowGraphic) {
      this.glowGraphic.x = sx
      this.glowGraphic.y = sy
    }

    if (this.labelText) {
      this.labelText.x = sx + 8
      this.labelText.y = sy - 8
    }

    if (this.showRadiusVector && this.body !== this.reference) {
      this.radiusVector.clear()
      this.radiusVector.moveTo(0, 0)
      this.radiusVector.lineTo(sx, sy)
      this.radiusVector.stroke({ color: 0x334455, width: 1 })
    } else {
      this.radiusVector.clear()
    }
  }

  private rebuildOrbitPath(): void {
    this.orbitPathGraphic.clear()
    if (this.body === this.reference) return

    const points = samplePath(
      this.body, this.reference, this.samplePeriod, this.orbitSamples, this.transform
    )
    this.orbitPathGraphic.poly(points, true)
    this.orbitPathGraphic.stroke({ color: 0x223355, width: 1 })
  }
}

function samplePath(
  body: Body,
  reference: Body,
  period: number,
  n: number,
  transform: SceneTransform,
): { x: number; y: number }[] {
  return Array.from({ length: n }, (_, i) => {
    const t = (i / n) * period
    const world = body.worldPosition(t)
    const ref = reference.worldPosition(t)
    return transform.apply(world.x - ref.x, world.y - ref.y)
  })
}
