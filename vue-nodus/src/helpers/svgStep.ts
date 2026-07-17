/** Horizontal midpoint used as the step point for the two-corner orthogonal path. */
export function stepMidX(x1: number, x2: number): number {
    return (x1 + x2) / 2
}

export function buildStepPath(x1: number, y1: number, x2: number, y2: number): string {
    const midX = stepMidX(x1, x2)

    return `M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`
}

/** Always lies on the vertical segment (or the collapsed horizontal segment when y1 === y2). */
export function getStepMidpoint(
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
