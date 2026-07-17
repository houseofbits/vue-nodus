export function buildStraightPath(x1: number, y1: number, x2: number, y2: number): string {
    return `M ${x1} ${y1} L ${x2} ${y2}`
}

export function getStraightMidpoint(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
): { x: number; y: number } {
    return {
        x: (x1 + x2) / 2,
        y: (y1 + y2) / 2,
    }
}
