# Epicycles

**Live demo: [antoninus.org/epicycles/](https://antoninus.org/epicycles/)**

An interactive animation comparing Kepler's heliocentric model against Ptolemy's geocentric model for the classical planets (Mercury, Venus, Mars, Jupiter, Saturn).

Built with [Vite](https://vitejs.dev/), TypeScript, and [PixiJS](https://pixijs.com/).

## What it shows

Each planet is rendered twice simultaneously:

- **Kep** (bright) — Keplerian elliptical orbit, solved via eccentric anomaly (Newton-Raphson)
- **Pto** (warm) — Ptolemaic deferent + epicycle + eccentric + equant, using parameters from the *Almagest*

A connecting line between each pair shows how closely the two models agree at any moment. Both models start co-located at t = 0.

Press **F** to toggle between the Sun-centred (heliocentric) and Earth-centred (geocentric) reference frames.

## Models

| Planet  | Keplerian source | Ptolemaic source |
|---------|-----------------|-----------------|
| Sun     | Kepler (e = 0.0167) | Almagest eccentric |
| Mercury | Kepler (e = 0.2056) | Almagest crank mechanism |
| Venus   | Kepler (e = 0.0068) | Almagest deferent + epicycle |
| Mars    | Kepler (e = 0.0934) | Almagest deferent + epicycle |
| Jupiter | Kepler (e = 0.0484) | Almagest deferent + epicycle |
| Saturn  | Kepler (e = 0.0539) | Almagest deferent + epicycle |

Distances are in AU. A log-radial transform is applied so all planets fit on screen at once.

## Development

```bash
npm install
npm run dev      # local dev server
npm run build    # production build → dist/
npm run preview  # preview the build
```

The production build goes to `docs/` for GitHub Pages deployment.
