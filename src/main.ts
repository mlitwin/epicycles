import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js'
import { solveKepler, eccentricAnomalyToPosition } from './kepler'

// --- Orbital parameters ---
const a = 220          // semi-major axis (px)
const b = 160          // semi-minor axis (px)
const c = Math.sqrt(a * a - b * b)  // focal distance from ellipse center
const e = c / a        // eccentricity
const T = 6            // orbital period (seconds)

// Sun is placed at the left focus: (-c, 0) relative to ellipse center.
// Scene origin = ellipse center.

async function main() {
  const app = new Application()
  await app.init({
    background: '#07080f',
    resizeTo: window,
    antialias: true,
  })
  document.body.appendChild(app.canvas)

  // Scene container — origin at ellipse center, centered on screen
  const scene = new Container()
  app.stage.addChild(scene)
  scene.x = app.screen.width / 2
  scene.y = app.screen.height / 2

  window.addEventListener('resize', () => {
    scene.x = app.screen.width / 2
    scene.y = app.screen.height / 2
  })

  // --- Orbit path ---
  const orbitPath = new Graphics()
  orbitPath.ellipse(0, 0, a, b)
  orbitPath.stroke({ color: 0x223355, width: 1 })
  scene.addChild(orbitPath)

  // --- Radius vector (Sun → Earth line, shows Kepler's 2nd law) ---
  const radiusVector = new Graphics()
  scene.addChild(radiusVector)

  // --- Sun at left focus ---
  const sun = new Graphics()
  sun.circle(0, 0, 14)
  sun.fill(0xffe066)
  sun.x = -c
  sun.y = 0
  scene.addChild(sun)

  // Sun glow
  const sunGlow = new Graphics()
  sunGlow.circle(0, 0, 22)
  sunGlow.fill({ color: 0xffe066, alpha: 0.15 })
  sunGlow.x = -c
  sunGlow.y = 0
  scene.addChild(sunGlow)

  // --- Empty right focus marker ---
  const rightFocus = new Graphics()
  rightFocus.circle(0, 0, 3)
  rightFocus.fill({ color: 0x446688, alpha: 0.6 })
  rightFocus.x = c
  rightFocus.y = 0
  scene.addChild(rightFocus)

  // --- Earth ---
  const earth = new Graphics()
  earth.circle(0, 0, 7)
  earth.fill(0x4488ff)
  scene.addChild(earth)

  // --- Labels ---
  const labelStyle = new TextStyle({ fill: 0x8899bb, fontSize: 12, fontFamily: 'monospace' })

  const sunLabel = new Text({ text: 'Sun', style: labelStyle })
  sunLabel.x = -c + 18
  sunLabel.y = -8
  scene.addChild(sunLabel)

  const earthLabel = new Text({ text: 'Earth', style: labelStyle })
  scene.addChild(earthLabel)

  const infoStyle = new TextStyle({ fill: 0x556677, fontSize: 11, fontFamily: 'monospace' })
  const info = new Text({
    text: `a=${a}px  b=${b}px  e=${e.toFixed(3)}  T=${T}s`,
    style: infoStyle,
  })
  info.x = 12
  info.y = 12
  app.stage.addChild(info)

  // --- Animation loop ---
  let elapsed = 0

  app.ticker.add((ticker) => {
    elapsed += ticker.deltaMS / 1000  // seconds

    const M = ((2 * Math.PI * elapsed) / T) % (2 * Math.PI)
    const E = solveKepler(M, e)
    const { x, y } = eccentricAnomalyToPosition(E, a, b)

    earth.x = x
    earth.y = y

    earthLabel.x = x + 10
    earthLabel.y = y - 8

    // Draw radius vector from Sun focus to Earth
    radiusVector.clear()
    radiusVector.moveTo(-c, 0)
    radiusVector.lineTo(x, y)
    radiusVector.stroke({ color: 0x334455, width: 1 })
  })
}

main()
