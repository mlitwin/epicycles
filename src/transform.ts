export interface SceneTransform {
  apply(x: number, y: number): { x: number; y: number }
}

export class IdentityTransform implements SceneTransform {
  apply(x: number, y: number): { x: number; y: number } {
    return { x, y }
  }
}

/**
 * Radial logarithmic transform: preserves angle, compresses radius.
 *   r_screen = pxInner + (pxOuter - pxInner) * ln(r / rMin) / ln(rMax / rMin)
 * Points with r < rMin are clamped; r = 0 maps to the screen origin.
 */
export class LogRadialTransform implements SceneTransform {
  private readonly rMin: number
  private readonly logRange: number
  private readonly pxInner: number
  private readonly pxRange: number

  constructor(opts: {
    rMin: number    // AU — inner reference (Mercury perihelion ≈ 0.2)
    rMax: number    // AU — outer reference (beyond Saturn ≈ 12)
    pxInner: number // screen px for rMin
    pxOuter: number // screen px for rMax
  }) {
    this.rMin = opts.rMin
    this.logRange = Math.log(opts.rMax / opts.rMin)
    this.pxInner = opts.pxInner
    this.pxRange = opts.pxOuter - opts.pxInner
  }

  apply(x: number, y: number): { x: number; y: number } {
    const r = Math.sqrt(x * x + y * y)
    if (r < 1e-10) return { x: 0, y: 0 }
    const rPx = this.pxInner + this.pxRange * Math.log(Math.max(r, this.rMin) / this.rMin) / this.logRange
    const scale = rPx / r
    return { x: x * scale, y: y * scale }
  }
}
