import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import type { Planet } from './planet'

/**
 * Draws a line between a Keplerian planet and its Ptolemaic counterpart,
 * and shows the planet name label at the midpoint of that line.
 */
export class PlanetPair {
  private readonly keplerPlanet: Planet
  private readonly ptolemyPlanet: Planet
  private readonly line: Graphics
  private readonly label: Text

  constructor(
    scene: Container,
    keplerPlanet: Planet,
    ptolemyPlanet: Planet,
    name: string,
    color: number,
  ) {
    this.keplerPlanet = keplerPlanet
    this.ptolemyPlanet = ptolemyPlanet

    this.line = new Graphics()
    scene.addChild(this.line)

    const style = new TextStyle({ fill: color, fontSize: 11, fontFamily: 'monospace' })
    this.label = new Text({ text: name, style })
    scene.addChild(this.label)
  }

  update(): void {
    const { x: kx, y: ky } = this.keplerPlanet.screenPos
    const { x: px, y: py } = this.ptolemyPlanet.screenPos

    this.line.clear()
    this.line.moveTo(kx, ky)
    this.line.lineTo(px, py)
    this.line.stroke({ color: 0x445566, width: 1 })

    this.label.x = (kx + px) / 2 + 4
    this.label.y = (ky + py) / 2 - 8
  }
}
