# Epicycles — Implementation Plan

## Goal

Display all 5 classical planets (Mercury, Venus, Mars, Jupiter, Saturn) plus Earth and the
Sun, animated simultaneously, using both **Keplerian** and **Ptolemaic** orbital models.
A logarithmic radial scale fits everything on screen at once. A frame toggle switches
between heliocentric (Sun) and geocentric (Earth) reference frames.

---

## Orbital Data

### Keplerian Elements (J2000 epoch)

| Planet  | a (AU)  | e      | T (yr)  | b = a√(1−e²) (AU) |
|---------|---------|--------|---------|-------------------|
| Mercury | 0.3871  | 0.2056 | 0.2408  | 0.3789            |
| Venus   | 0.7233  | 0.0068 | 0.6152  | 0.7232            |
| Earth   | 1.0000  | 0.0167 | 1.0000  | 0.9999            |
| Mars    | 1.5237  | 0.0934 | 1.8809  | 1.5171            |
| Jupiter | 5.2029  | 0.0484 | 11.862  | 5.1968            |
| Saturn  | 9.5367  | 0.0539 | 29.457  | 9.5092            |

`b` is derived; all other values are from JPL/J2000 epoch data.

### Ptolemaic Elements (from the Almagest)

Ptolemy expresses all distances in sexagesimal parts with deferent = 60.
Conversion to AU:
- **Outer planets** (Mars, Jupiter, Saturn): 60 parts = planet's `a`
- **Inner planets** (Mercury, Venus) + Sun: 60 parts = Earth's `a` = 1 AU

Almagest eccentricities for outer planets are the **full equant distance** (bisected
eccentricity: eccentric offset = half, equant = full).

| Planet  | R (AU)  | r (AU)  | eccentric (AU) | equant (AU) | T_d (yr) | T_e (yr) | parent |
|---------|---------|---------|----------------|-------------|----------|----------|--------|
| Sun     | 1.0000  | 0       | 0.0167         | 0.0334      | 1.000    | —        | Earth  |
| Mercury | 1.0000  | 0.3750  | ≈ 0.014        | ≈ 0.027     | 1.000    | 0.2408   | Earth  |
| Venus   | 1.0000  | 0.7250  | ≈ 0.014        | ≈ 0.027     | 1.000    | 0.6152   | Earth  |
| Mars    | 1.5237  | 1.0030  | 0.152          | 0.304       | 1.8809   | 1.000    | Earth  |
| Jupiter | 5.2029  | 0.9970  | 0.238          | 0.477       | 11.862   | 1.000    | Earth  |
| Saturn  | 9.5367  | 1.0390  | 0.543          | 1.086       | 29.457   | 1.000    | Earth  |

Raw Almagest epicycle values (sexagesimal, deferent = 60):
Mercury 22:30, Venus 43:10, Mars 39:30, Jupiter 11:30, Saturn 6:32.
Raw Almagest full eccentricities: Mars 12:00, Jupiter 5:30, Saturn 6:50.

#### Structural differences: inner vs outer planets

**Outer planets** (Mars, Jupiter, Saturn):
- `T_d` = planet's sidereal period; the deferent represents the planet's orbit
- `T_e` = 1 year; the epicycle represents Earth's annual motion around the Sun
- Epicycle radius ≈ 1 AU in all three cases — the Copernican interpretation hidden in Ptolemy's numbers

**Inner planets** (Mercury, Venus):
- `T_d` = 1 year; the deferent follows the Sun's mean annual motion
- `T_e` = planet's sidereal period; the epicycle is the planet's orbit around the Sun
- Epicycle radius ≈ planet's `a` in AU

**All Ptolemaic bodies have `parent = earth`** — geocentric model. In the Earth frame
`position(t)` is the raw Ptolemaic geocentric path. In the Sun frame the parent offset
converts it to the heliocentric-equivalent automatically.

---

## Logarithmic Radial Scale

Orbital radii span ~25× from Mercury to Saturn. A radial log transform keeps all planets
on screen while preserving their angular positions.

### Transform

```
r_screen = r_inner + (r_outer − r_inner) × ln(r_AU / r_min) / ln(r_max / r_min)
```

Applied per-point to (x, y): preserve angle θ = atan2(y, x), transform only the radius.

### Parameters

| Constant  | Value   | Rationale                              |
|-----------|---------|----------------------------------------|
| `r_min`   | 0.20 AU | Just inside Mercury's perihelion       |
| `r_max`   | 12.0 AU | Just outside Saturn's aphelion         |
| `r_inner` | 30 px   | Mercury orbit screen radius            |
| `r_outer` | 500 px  | Saturn orbit screen radius             |

### Resulting screen radii (Sun frame)

| Body    | r (AU) | r_screen (px) |
|---------|--------|---------------|
| Mercury | 0.387  | ~106          |
| Venus   | 0.723  | ~178          |
| Earth   | 1.000  | ~215          |
| Mars    | 1.524  | ~263          |
| Jupiter | 5.203  | ~404          |
| Saturn  | 9.537  | ~473          |

Special case: Sun at r = 0 is clamped to screen origin (log undefined at zero).

---

## Architecture

### New / changed files

```
src/
  solarSystem.ts    NEW  Keplerian + Ptolemaic parameter records; time scale constant
  transform.ts      NEW  SceneTransform interface + LogRadialTransform implementation
  orbit.ts          —    unchanged
  kepler.ts         —    unchanged
  ptolemaic.ts      —    unchanged (phase param already added)
  body.ts           —    unchanged
  planet.ts         MOD  accept optional SceneTransform; apply in samplePath + update
  main.ts           MOD  rebuild with all bodies, log transform, retain frame toggle
```

### `src/transform.ts`

```typescript
interface SceneTransform {
  apply(x: number, y: number): { x: number; y: number }
}

class IdentityTransform implements SceneTransform   // current pixel-space behaviour
class LogRadialTransform implements SceneTransform  // ln-based radial compression
```

### `src/solarSystem.ts`

```typescript
const SECONDS_PER_YEAR = 1   // simulation speed: 1 real year = 1 sim second

const KEPLER: Record<string, KeplerParams>     // a, b, T for each planet
const PTOLEMY: Record<string, PtolemaicParams> // R, r, e, equant, T_d, T_e, phase
// Mercury crank parameters defined separately (chained OrbitalBody)
```

### `src/planet.ts` changes

`PlanetOptions` gains:
```typescript
transform?: SceneTransform   // default: IdentityTransform
```

`samplePath()` and `update()` run each (x, y) through `transform.apply(x, y)` before
writing to PixiJS graphics/positions.

### `src/main.ts` changes

- Coordinate space changes from pixels to AU throughout
- One `KeplerOrbit` + `OrbitalBody` per planet (yellow palette)
- One `PtolemaicOrbit` + `OrbitalBody` per planet, parent = `earth` (orange palette)
- Mercury Ptolemaic: two chained `OrbitalBody` nodes (deferent → crank → epicycle)
- Both models always rendered simultaneously; colour distinguishes them
- Both sets of planets use the same `LogRadialTransform`
- Frame toggle ([F]) unchanged

---

## Decisions

1. **Time scale** — 1 sim-second = 1 real year. Saturn ~29s per orbit, Mercury ~0.24s.

2. **Phase alignment** — `phase = π` for all Ptolemaic bodies (starts at perihelion,
   aligning with Kepler `E = 0`).

3. **Mercury** — implement faithfully with Ptolemy's second epicycle ("crank"
   mechanism). Requires a chained `OrbitalBody`: the crank center orbits on the
   deferent, and Mercury orbits the crank center. The crank has a small radius and
   rotates at twice the deferent rate in the opposite direction, producing the
   oscillating eccentricity that Ptolemy used to match Mercury's anomalous motion.

4. **UI** — Kepler and Ptolemy always both visible, overlaid in different colours.
   No toggle needed; the visual difference is the point.

5. **Orbit path rendering under log transform** — 256 sample points sufficient;
   increase to 512 for Mercury if the inner orbit shows angular artifacts.
