export function buildBezierPath(x1: number, y1: number, x2: number, y2: number, invert = false) {
    const dx = x2 - x1;

    let cpOffset = Math.max(Math.abs(dx) * 0.5, 80);

    if (invert) {
        cpOffset = -cpOffset;
    }

    const cp1x = x1 + cpOffset;
    const cp1y = y1;

    const cp2x = x2 - cpOffset;
    const cp2y = y2;

    return `M ${x1} ${y1}
            C ${cp1x} ${cp1y},
              ${cp2x} ${cp2y},
              ${x2} ${y2}`;
}