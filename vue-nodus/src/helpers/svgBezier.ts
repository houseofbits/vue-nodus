function bezierControlPoints(x1: number, y1: number, x2: number, y2: number, invert: boolean) {
    const dx = x2 - x1;
    const dy = y2 - y1;

    let cpOffset = Math.max(Math.abs(dx) * 0.5, Math.abs(dy) * 0.5, 80);

    if (invert) {
        cpOffset = -cpOffset;
    }

    return {
        cp1x: x1 + cpOffset,
        cp1y: y1,
        cp2x: x2 - cpOffset,
        cp2y: y2,
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