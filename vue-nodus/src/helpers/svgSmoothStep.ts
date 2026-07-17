import { buildStepPath, stepMidX } from './svgStep.js'

const MAX_CORNER_RADIUS = 24

/** Clamped so the two rounded corners never overlap each other or overshoot the endpoints. */
function cornerRadius(dx: number, dy: number): number {
    return Math.min(MAX_CORNER_RADIUS, Math.abs(dx) / 2, Math.abs(dy) / 2)
}

export function buildSmoothStepPath(x1: number, y1: number, x2: number, y2: number): string {
    const midX = stepMidX(x1, x2)
    const dx = x2 - x1
    const dy = y2 - y1
    const r = cornerRadius(dx, dy)

    // No room to round (a straight horizontal or vertical segment) - degrade to the sharp-corner step.
    if (r <= 0) {
        return buildStepPath(x1, y1, x2, y2)
    }

    const signX = dx >= 0 ? 1 : -1
    const signY = dy >= 0 ? 1 : -1

    return `M ${x1} ${y1}
            L ${midX - signX * r} ${y1}
            Q ${midX} ${y1}, ${midX} ${y1 + signY * r}
            L ${midX} ${y2 - signY * r}
            Q ${midX} ${y2}, ${midX + signX * r} ${y2}
            L ${x2} ${y2}`
}

/** Same as the sharp-corner step midpoint - still lies on-path even at the maximum corner radius. */
export function getSmoothStepMidpoint(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
): { x: number; y: number } {
    return {
        x: stepMidX(x1, x2),
        y: (y1 + y2) / 2,
    }
}
