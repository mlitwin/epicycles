import { Container, Graphics } from 'pixi.js'
import type { Planet } from './planet'

/**
 * Draws a line between a Keplerian planet and its Ptolemaic counterpart.
 */
export class PlanetPair {
  private readonly keplerPlanet: Planet
  private readonly ptolemyPlanet: Planet
  private readonly line: Graphics

  constructor(
    scene: Container,
    keplerPlanet: Planet,
    ptolemyPlanet: Planet,
  ) {
    this.keplerPlanet = keplerPlanet
    this.ptolemyPlanet = ptolemyPlanet

    this.line = new Graphics()
    scene.addChild(this.line)
  }

  update(): void {
    const { x: kx, y: ky } = this.keplerPlanet.screenPos
    const { x: px, y: py } = this.ptolemyPlanet.screenPos

    this.line.clear()
    this.line.moveTo(kx, ky)
    this.line.lineTo(px, py)
    this.line.stroke({ color: 0x445566, width: 1 })
  }
}
