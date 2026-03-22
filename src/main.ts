import { Application, Container, Text, TextStyle } from 'pixi.js'
import { KeplerOrbit } from './kepler'
import { PtolemaicOrbit, MercuryOrbit } from './ptolemaic'
import { FixedBody, OrbitalBody } from './body'
import type { Body } from './body'
import { Planet } from './planet'
import { LogRadialTransform } from './transform'
import { KEPLER, PTOLEMY, MERCURY_PTOLEMY, STYLES } from './solarSystem'

async function main() {
  const app = new Application()
  await app.init({ background: '#07080f', resizeTo: window, antialias: true })
  document.body.appendChild(app.canvas)

  const scene = new Container()
  app.stage.addChild(scene)
  const centerScene = () => {
    scene.x = app.screen.width / 2
    scene.y = app.screen.height / 2
  }
  centerScene()
  window.addEventListener('resize', centerScene)

  // --- Coordinate transform: AU → screen pixels ---
  const transform = new LogRadialTransform({ rMin: 0.2, rMax: 12.0, pxInner: 30, pxOuter: 500 })

  // ---------------------------------------------------------------------------
  // Bodies — Keplerian (heliocentric, parent = Sun)
  // ---------------------------------------------------------------------------
  const sun = new FixedBody('Sun')

  const earthOrbit   = new KeplerOrbit(KEPLER.earth)
  const mercuryOrbit = new KeplerOrbit(KEPLER.mercury)
  const venusOrbit   = new KeplerOrbit(KEPLER.venus)
  const marsOrbit    = new KeplerOrbit(KEPLER.mars)
  const jupiterOrbit = new KeplerOrbit(KEPLER.jupiter)
  const saturnOrbit  = new KeplerOrbit(KEPLER.saturn)

  const earth   = new OrbitalBody('Earth',   sun, earthOrbit)
  const mercury = new OrbitalBody('Mercury', sun, mercuryOrbit)
  const venus   = new OrbitalBody('Venus',   sun, venusOrbit)
  const mars    = new OrbitalBody('Mars',    sun, marsOrbit)
  const jupiter = new OrbitalBody('Jupiter', sun, jupiterOrbit)
  const saturn  = new OrbitalBody('Saturn',  sun, saturnOrbit)

  // ---------------------------------------------------------------------------
  // Phase calibration — align Ptolemaic positions with Keplerian at t=0
  // ---------------------------------------------------------------------------

  /**
   * Find the deferent phase (θ) and epicycle phase that minimise the distance
   * between the Ptolemaic planet and the geocentric Keplerian target at t=0.
   *
   * evalK(θ) returns the epicycle-centre K for a given equant angle θ.
   * r is the epicycle radius; target is the desired Keplerian geocentric position.
   */
  function findBestPhases(
    evalK: (θ: number) => { x: number; y: number },
    r: number,
    target: { x: number; y: number },
    steps = 3600,
  ): { phase: number; epicyclePhase: number } {
    let bestPhase = 0
    let bestEpicyclePhase = 0
    let bestResidual = Infinity
    for (let i = 0; i < steps; i++) {
      const θ = (2 * Math.PI * i) / steps
      const K = evalK(θ)
      const dKT = Math.hypot(target.x - K.x, target.y - K.y)
      const residual = r > 1e-9 ? Math.abs(dKT - r) : dKT
      if (residual < bestResidual) {
        bestResidual = residual
        bestPhase = θ
        bestEpicyclePhase = r > 1e-9 ? Math.atan2(target.y - K.y, target.x - K.x) : 0
      }
    }
    return { phase: bestPhase, epicyclePhase: bestEpicyclePhase }
  }

  // Geocentric Keplerian targets at t=0
  const earthPos0 = earth.worldPosition(0)
  function geoTarget(body: { worldPosition(t: number): { x: number; y: number } }) {
    const p = body.worldPosition(0)
    return { x: p.x - earthPos0.x, y: p.y - earthPos0.y }
  }

  // Sun Ptolemaic — deferent-only eccentric (r=0)
  const sunTarget = geoTarget(sun)
  const sunPhases = findBestPhases((θ) => {
    const { e, equant } = PTOLEMY.sun
    const Δ = equant - e
    const s = -Δ * Math.cos(θ) + Math.sqrt(PTOLEMY.sun.R ** 2 - Δ ** 2 * Math.sin(θ) ** 2)
    return { x: equant + s * Math.cos(θ), y: s * Math.sin(θ) }
  }, 0, sunTarget)

  // Venus Ptolemaic
  const venusTarget = geoTarget(venus)
  const venusPhases = findBestPhases((θ) => {
    const { R, e, equant } = PTOLEMY.venus
    const Δ = equant - e
    const s = -Δ * Math.cos(θ) + Math.sqrt(R ** 2 - Δ ** 2 * Math.sin(θ) ** 2)
    return { x: equant + s * Math.cos(θ), y: s * Math.sin(θ) }
  }, PTOLEMY.venus.r, venusTarget)

  // Mars Ptolemaic
  const marsTarget = geoTarget(mars)
  const marsPhases = findBestPhases((θ) => {
    const { R, e, equant } = PTOLEMY.mars
    const Δ = equant - e
    const s = -Δ * Math.cos(θ) + Math.sqrt(R ** 2 - Δ ** 2 * Math.sin(θ) ** 2)
    return { x: equant + s * Math.cos(θ), y: s * Math.sin(θ) }
  }, PTOLEMY.mars.r, marsTarget)

  // Jupiter Ptolemaic
  const jupiterTarget = geoTarget(jupiter)
  const jupiterPhases = findBestPhases((θ) => {
    const { R, e, equant } = PTOLEMY.jupiter
    const Δ = equant - e
    const s = -Δ * Math.cos(θ) + Math.sqrt(R ** 2 - Δ ** 2 * Math.sin(θ) ** 2)
    return { x: equant + s * Math.cos(θ), y: s * Math.sin(θ) }
  }, PTOLEMY.jupiter.r, jupiterTarget)

  // Saturn Ptolemaic
  const saturnTarget = geoTarget(saturn)
  const saturnPhases = findBestPhases((θ) => {
    const { R, e, equant } = PTOLEMY.saturn
    const Δ = equant - e
    const s = -Δ * Math.cos(θ) + Math.sqrt(R ** 2 - Δ ** 2 * Math.sin(θ) ** 2)
    return { x: equant + s * Math.cos(θ), y: s * Math.sin(θ) }
  }, PTOLEMY.saturn.r, saturnTarget)

  // Mercury Ptolemaic (crank model)
  const mercuryTarget = geoTarget(mercury)
  const mercuryPhases = findBestPhases((θ) => {
    const { R, e } = MERCURY_PTOLEMY
    const s = Math.sqrt(Math.max(0, R ** 2 - 4 * e ** 2 * Math.sin(θ) ** 2))
    return { x: 2 * e + s * Math.cos(θ), y: s * Math.sin(θ) }
  }, MERCURY_PTOLEMY.r, mercuryTarget)

  // ---------------------------------------------------------------------------
  // Bodies — Ptolemaic (geocentric, parent = Earth)
  // ---------------------------------------------------------------------------
  const ptolSunOrbit     = new PtolemaicOrbit({ ...PTOLEMY.sun,     ...sunPhases })
  const ptolMercuryOrbit = new MercuryOrbit(  { ...MERCURY_PTOLEMY, ...mercuryPhases })
  const ptolVenusOrbit   = new PtolemaicOrbit({ ...PTOLEMY.venus,   ...venusPhases })
  const ptolMarsOrbit    = new PtolemaicOrbit({ ...PTOLEMY.mars,    ...marsPhases })
  const ptolJupiterOrbit = new PtolemaicOrbit({ ...PTOLEMY.jupiter, ...jupiterPhases })
  const ptolSaturnOrbit  = new PtolemaicOrbit({ ...PTOLEMY.saturn,  ...saturnPhases })

  const ptolSun     = new OrbitalBody('Sun (Pto)',     earth, ptolSunOrbit)
  const ptolMercury = new OrbitalBody('Mercury (Pto)', earth, ptolMercuryOrbit)
  const ptolVenus   = new OrbitalBody('Venus (Pto)',   earth, ptolVenusOrbit)
  const ptolMars    = new OrbitalBody('Mars (Pto)',    earth, ptolMarsOrbit)
  const ptolJupiter = new OrbitalBody('Jupiter (Pto)', earth, ptolJupiterOrbit)
  const ptolSaturn  = new OrbitalBody('Saturn (Pto)',  earth, ptolSaturnOrbit)

  // ---------------------------------------------------------------------------
  // Visuals — helper
  // ---------------------------------------------------------------------------
  let reference: Body = sun

  function makePlanet(
    body: Body,
    style: { color: number; orbitColor: number; bodyRadius: number; glowRadius?: number },
    label: string,
    samplePeriod: number,
    showRadiusVector = false,
  ): Planet {
    return new Planet(scene, body, reference, {
      color: style.color,
      radius: style.bodyRadius,
      glowRadius: style.glowRadius,
      label,
      orbitColor: style.orbitColor,
      showOrbitPath: true,
      showRadiusVector,
      samplePeriod,
      transform,
    })
  }

  // Kepler planets
  const sunPlanet     = makePlanet(sun,     { color: STYLES.sun.keplerColor,     orbitColor: STYLES.sun.keplerOrbitColor,     bodyRadius: STYLES.sun.bodyRadius,     glowRadius: STYLES.sun.glowRadius },     'Sun',     KEPLER.earth.T)
  const earthPlanet   = makePlanet(earth,   { color: STYLES.earth.keplerColor,   orbitColor: STYLES.earth.keplerOrbitColor,   bodyRadius: STYLES.earth.bodyRadius },   'Earth',   KEPLER.earth.T, true)
  const mercuryPlanet = makePlanet(mercury, { color: STYLES.mercury.keplerColor, orbitColor: STYLES.mercury.keplerOrbitColor, bodyRadius: STYLES.mercury.bodyRadius }, 'Mercury', KEPLER.mercury.T)
  const venusPlanet   = makePlanet(venus,   { color: STYLES.venus.keplerColor,   orbitColor: STYLES.venus.keplerOrbitColor,   bodyRadius: STYLES.venus.bodyRadius },   'Venus',   KEPLER.venus.T)
  const marsPlanet    = makePlanet(mars,    { color: STYLES.mars.keplerColor,    orbitColor: STYLES.mars.keplerOrbitColor,    bodyRadius: STYLES.mars.bodyRadius },    'Mars',    KEPLER.mars.T)
  const jupiterPlanet = makePlanet(jupiter, { color: STYLES.jupiter.keplerColor, orbitColor: STYLES.jupiter.keplerOrbitColor, bodyRadius: STYLES.jupiter.bodyRadius }, 'Jupiter', KEPLER.jupiter.T)
  const saturnPlanet  = makePlanet(saturn,  { color: STYLES.saturn.keplerColor,  orbitColor: STYLES.saturn.keplerOrbitColor,  bodyRadius: STYLES.saturn.bodyRadius },  'Saturn',  KEPLER.saturn.T)

  // Ptolemaic planets
  const ptolSunPlanet     = makePlanet(ptolSun,     { color: STYLES.sun.ptolemyColor,     orbitColor: STYLES.sun.ptolemyOrbitColor,     bodyRadius: STYLES.sun.bodyRadius - 3,     glowRadius: 12 }, 'Sun (Pto)',     PTOLEMY.sun.samplePeriod)
  const ptolMercuryPlanet = makePlanet(ptolMercury, { color: STYLES.mercury.ptolemyColor, orbitColor: STYLES.mercury.ptolemyOrbitColor, bodyRadius: STYLES.mercury.bodyRadius },     'Mercury (Pto)', MERCURY_PTOLEMY.samplePeriod)
  const ptolVenusPlanet   = makePlanet(ptolVenus,   { color: STYLES.venus.ptolemyColor,   orbitColor: STYLES.venus.ptolemyOrbitColor,   bodyRadius: STYLES.venus.bodyRadius },       'Venus (Pto)',   PTOLEMY.venus.samplePeriod)
  const ptolMarsPlanet    = makePlanet(ptolMars,    { color: STYLES.mars.ptolemyColor,    orbitColor: STYLES.mars.ptolemyOrbitColor,    bodyRadius: STYLES.mars.bodyRadius },        'Mars (Pto)',    PTOLEMY.mars.samplePeriod)
  const ptolJupiterPlanet = makePlanet(ptolJupiter, { color: STYLES.jupiter.ptolemyColor, orbitColor: STYLES.jupiter.ptolemyOrbitColor, bodyRadius: STYLES.jupiter.bodyRadius },     'Jupiter (Pto)', PTOLEMY.jupiter.samplePeriod)
  const ptolSaturnPlanet  = makePlanet(ptolSaturn,  { color: STYLES.saturn.ptolemyColor,  orbitColor: STYLES.saturn.ptolemyOrbitColor,  bodyRadius: STYLES.saturn.bodyRadius },      'Saturn (Pto)',  PTOLEMY.saturn.samplePeriod)

  const planets = [
    sunPlanet, earthPlanet, mercuryPlanet, venusPlanet, marsPlanet, jupiterPlanet, saturnPlanet,
    ptolSunPlanet, ptolMercuryPlanet, ptolVenusPlanet, ptolMarsPlanet, ptolJupiterPlanet, ptolSaturnPlanet,
  ]

  // ---------------------------------------------------------------------------
  // Frame toggle
  // ---------------------------------------------------------------------------
  const frames: Body[] = [sun, earth]
  let frameIndex = 0

  const frameLabel = new Text({
    text: frameText(reference),
    style: new TextStyle({ fill: 0x556677, fontSize: 11, fontFamily: 'monospace' }),
  })
  frameLabel.x = 12
  frameLabel.y = 12
  app.stage.addChild(frameLabel)

  function toggleFrame() {
    frameIndex = (frameIndex + 1) % frames.length
    reference = frames[frameIndex]
    for (const p of planets) p.setReference(reference)
    frameLabel.text = frameText(reference)
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'f' || e.key === 'F') toggleFrame()
  })

  // ---------------------------------------------------------------------------
  // Animation loop
  // ---------------------------------------------------------------------------
  let elapsed = 0
  app.ticker.add((ticker) => {
    elapsed += ticker.deltaMS / 1000
    for (const p of planets) p.update(elapsed)
  })
}

function frameText(ref: Body): string {
  return `Frame: ${ref.name}  [F] to toggle`
}

main()
