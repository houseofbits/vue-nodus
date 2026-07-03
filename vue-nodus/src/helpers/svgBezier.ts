const MIN_CURVE_OFFSET = 30;
const MAX_CURVE_OFFSET = 150;

/**
 * Vertical "bow" added to both control points when two ports sit on (or very near) the same
 * horizontal line. Without it, cp1y/cp2y are pinned to y1/y2, so a `dy ≈ 0` connection is
 * mathematically a perfectly flat horizontal segment no matter how much the horizontal
 * S-offset (`cpOffset`) bulges — it reads as a plain line rather than a curve. The bow nudges
 * both control points by the same amount (so the curve forms a single symmetric hump, not an
 * asymmetric wiggle) and fades out smoothly as `dy` grows, so there's no visible seam between
 * the "artificially bowed" and "naturally curved" (large-dy) regimes.
 */
const MAX_VERTICAL_BOW = 24;
const VERTICAL_BOW_FALLOFF_DISTANCE = 60;

/**
 * Smoothstep-based falloff: 1 at dy=0, 0 once |dy| >= VERTICAL_BOW_FALLOFF_DISTANCE, with a
 * zero derivative at both ends so there's no kink where the bow appears/disappears.
 */
function verticalBow(dy: number): number {
    const t = Math.min(Math.abs(dy) / VERTICAL_BOW_FALLOFF_DISTANCE, 1);
    const smoothstep = t * t * (3 - 2 * t);
    return MAX_VERTICAL_BOW * (1 - smoothstep);
}

/**
 * Exported (but not part of the public package API — this module isn't re-exported from
 * src/index.ts) so the offset heuristic can be unit tested directly.
 */
export function bezierControlPoints(x1: number, y1: number, x2: number, y2: number, invert: boolean) {
    const dx = x2 - x1;
    const dy = y2 - y1;

    // Only `dx` drives the horizontal offset: letting `dy` inflate `cpOffset` (the old
    // behaviour) only produced a huge, unrelated sideways bulge for far-apart vertical
    // connections. The MIN/MAX clamp bounds both the "horizontal line" overshoot (small dx)
    // and runaway growth (large dx), instead of the old floor-only Math.max.
    let cpOffset = Math.min(Math.max(Math.abs(dx) * 0.5, MIN_CURVE_OFFSET), MAX_CURVE_OFFSET);

    if (invert) {
        cpOffset = -cpOffset;
    }

    // Note: x(t) of a cubic bezier only depends on x1/cp1x/cp2x/x2, never on any y value, so
    // this vertical bow cannot reintroduce the horizontal overshoot fixed above.
    const bow = verticalBow(dy);

    return {
        cp1x: x1 + cpOffset,
        cp1y: y1 + bow,
        cp2x: x2 - cpOffset,
        cp2y: y2 + bow,
    };
}

export function buildBezierPath(x1: number, y1: number, x2: number, y2: number, invert = false): string {
    const { cp1x, cp1y, cp2x, cp2y } = bezierControlPoints(x1, y1, x2, y2, invert);

    return `M ${x1} ${y1}
            C ${cp1x} ${cp1y},
              ${cp2x} ${cp2y},
              ${x2} ${y2}`;
}

/** Point at t=0.5 on the cubic Bezier curve built by `buildBezierPath`. */
export function getBezierMidpoint(x1: number, y1: number, x2: number, y2: number, invert = false): { x: number, y: number } {
    const { cp1x, cp1y, cp2x, cp2y } = bezierControlPoints(x1, y1, x2, y2, invert);

    return {
        x: (x1 + 3 * cp1x + 3 * cp2x + x2) / 8,
        y: (y1 + 3 * cp1y + 3 * cp2y + y2) / 8,
    };
}
