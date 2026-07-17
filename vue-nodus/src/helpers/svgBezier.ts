const MIN_CURVE_OFFSET = 30
const MAX_CURVE_OFFSET = 150
const MAX_VERTICAL_BOW = 24
const VERTICAL_BOW_FALLOFF = 60

/**
 * Exported (but not part of the public package API — this module isn't re-exported from
 * src/index.ts) so the offset heuristic can be unit tested directly.
 */
export function bezierControlPoints(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    invert: boolean,
) {
    const dx = x2 - x1

    // Only `dx` drives the horizontal offset: letting `dy` inflate `cpOffset` (the old
    // behaviour) only produced a huge, unrelated sideways bulge for far-apart vertical
    // connections. The MIN/MAX clamp bounds both the "horizontal line" overshoot (small dx)
    // and runaway growth (large dx), instead of the old floor-only Math.max.
    let cpOffset = Math.min(Math.max(Math.abs(dx) * 0.5, MIN_CURVE_OFFSET), MAX_CURVE_OFFSET)

    if (invert) {
        cpOffset = -cpOffset
    }

    // Near-level connections would otherwise render as a flat line (and hide the
    // delete marker on it). Bow both control points away from the shared y, fading
    // the bow linearly to zero as |dy| approaches the falloff distance.
    const dy = y2 - y1
    const bow = MAX_VERTICAL_BOW * Math.max(0, 1 - Math.abs(dy) / VERTICAL_BOW_FALLOFF)

    return {
        cp1x: x1 + cpOffset,
        cp1y: y1 + bow,
        cp2x: x2 - cpOffset,
        cp2y: y2 + bow,
    }
}

export function buildBezierPath(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    invert = false,
): string {
    const { cp1x, cp1y, cp2x, cp2y } = bezierControlPoints(x1, y1, x2, y2, invert)

    return `M ${x1} ${y1}
            C ${cp1x} ${cp1y},
              ${cp2x} ${cp2y},
              ${x2} ${y2}`
}

/** Point at t=0.5 on the cubic Bezier curve built by `buildBezierPath`. */
export function getBezierMidpoint(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    invert = false,
): { x: number; y: number } {
    const { cp1x, cp1y, cp2x, cp2y } = bezierControlPoints(x1, y1, x2, y2, invert)

    return {
        x: (x1 + 3 * cp1x + 3 * cp2x + x2) / 8,
        y: (y1 + 3 * cp1y + 3 * cp2y + y2) / 8,
    }
}
