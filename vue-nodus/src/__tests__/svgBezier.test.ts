import { describe, it, expect } from 'vitest'
import { buildBezierPath, getBezierMidpoint, bezierControlPoints } from '../helpers/svgBezier'

/** Sample a cubic bezier at parameter t given two endpoints and two control points. */
function cubicBezierAt(t: number, p0: number, p1: number, p2: number, p3: number) {
    const mt = 1 - t
    return mt ** 3 * p0 + 3 * mt ** 2 * t * p1 + 3 * mt * t ** 2 * p2 + t ** 3 * p3
}

/** Extract every numeric literal (in source order) from an SVG path `d` string. */
function extractNumbers(d: string): number[] {
    return (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number)
}

describe('bezierControlPoints', () => {
    it('clamps the offset to the max when nodes are far apart horizontally', () => {
        const { cp1x, cp2x } = bezierControlPoints(0, 0, 2000, 0, false)
        expect(cp1x).toBeCloseTo(150)
        expect(cp2x).toBeCloseTo(1850)
    })

    it('clamps the offset to the max when nodes are far apart vertically with a small horizontal gap', () => {
        // Regression: previously `dy` alone drove the horizontal offset, producing a huge
        // sideways bulge for what should be a nearly-straight vertical connection.
        const { cp1x, cp2x } = bezierControlPoints(100, 0, 105, 2000, false)
        expect(cp1x).toBeCloseTo(130)
        expect(cp2x).toBeCloseTo(75)
    })

    it('floors the offset when ports are very close horizontally', () => {
        const { cp1x, cp2x } = bezierControlPoints(0, 0, 2, 0, false)
        expect(cp1x).toBeCloseTo(30)
        expect(cp2x).toBeCloseTo(-28)
    })

    it('negates the offset when invert is true', () => {
        const normal = bezierControlPoints(0, 0, 200, 0, false)
        const inverted = bezierControlPoints(0, 0, 200, 0, true)

        expect(inverted.cp1x).toBeCloseTo(-normal.cp1x)
        expect(inverted.cp2x).toBeCloseTo(300)
    })

    it('bows cp1y/cp2y symmetrically by the same amount when dy = 0', () => {
        const { cp1y, cp2y } = bezierControlPoints(0, 50, 100, 50, false)
        expect(cp1y).toBeCloseTo(50 + 24)
        expect(cp2y).toBeCloseTo(50 + 24)
    })

    it('fades the vertical bow smoothly to zero as dy approaches the falloff distance', () => {
        const halfway = bezierControlPoints(0, 0, 100, 30, false) // dy = 30, half of the 60px falloff
        expect(halfway.cp1y).toBeCloseTo(12)
        expect(halfway.cp2y).toBeCloseTo(30 + 12)

        const nearThreshold = bezierControlPoints(0, 0, 100, 50, false) // dy = 50, near the 60px falloff
        expect(nearThreshold.cp1y).toBeGreaterThan(0)
        expect(nearThreshold.cp1y).toBeLessThan(5)

        const atThreshold = bezierControlPoints(0, 0, 100, 60, false) // dy = 60, exactly at the falloff distance
        expect(atThreshold.cp1y).toBe(0)
        expect(atThreshold.cp2y).toBe(60)
    })

    it('does not add any vertical bow once dy is far beyond the falloff distance', () => {
        // Regression: this must not affect the far-apart-vertically case that the horizontal
        // overshoot fix already covers.
        const { cp1y, cp2y } = bezierControlPoints(0, 0, 5, 800, false)
        expect(cp1y).toBe(0)
        expect(cp2y).toBe(800)
    })
})

describe('buildBezierPath', () => {
    it('keeps the sampled curve within a tight tolerance of [x1, x2] and bows vertically when points lie on a horizontal line', () => {
        // Regression: with the old fixed 80px floor, a short horizontal connection (dx=10)
        // overshot to roughly x = -14..24, far outside the [0, 10] span between the ports.
        // Separately, points on a shared horizontal line should no longer render as a flat
        // line — the curve should visibly bow away from that shared y.
        const x1 = 0
        const y = 0
        const x2 = 10
        const d = buildBezierPath(x1, y, x2, y, false)
        const [px1, py1, cp1x, cp1y, cp2x, cp2y, px2, py2] = extractNumbers(d)

        let minX = Infinity
        let maxX = -Infinity
        let maxY = -Infinity
        for (let t = 0; t <= 1; t += 0.001) {
            const x = cubicBezierAt(t, px1, cp1x, cp2x, px2)
            const yy = cubicBezierAt(t, py1, cp1y, cp2y, py2)
            minX = Math.min(minX, x)
            maxX = Math.max(maxX, x)
            maxY = Math.max(maxY, yy)
        }

        // x(t) in a cubic bezier only depends on the x-coordinates, so the vertical bow cannot
        // reintroduce the horizontal overshoot fixed previously.
        expect(minX).toBeGreaterThanOrEqual(x1 - 1)
        expect(maxX).toBeLessThanOrEqual(x2 + 1)

        // the endpoints are the actual port positions and stay exactly on the shared line...
        expect(py1).toBe(y)
        expect(py2).toBe(y)

        // ...but the control points - and therefore the curve itself - now bow symmetrically
        // away from the shared line by a bounded, non-trivial amount instead of staying flat.
        expect(cp1y).toBeCloseTo(y + 24)
        expect(cp2y).toBeCloseTo(y + 24)
        expect(maxY - y).toBeGreaterThan(10)
        expect(maxY - y).toBeLessThanOrEqual(24)
    })

    it('bounds the horizontal bulge for a long vertical connection with a small horizontal gap', () => {
        const x1 = 100
        const x2 = 105
        const d = buildBezierPath(x1, 0, x2, 2000, false)
        const [, , cp1x, , cp2x] = extractNumbers(d)

        expect(Math.abs(cp1x - x1)).toBeLessThanOrEqual(150)
        expect(Math.abs(x2 - cp2x)).toBeLessThanOrEqual(150)
    })
})

describe('getBezierMidpoint', () => {
    it('matches the buildBezierPath curve sampled at t=0.5', () => {
        const x1 = 20,
            y1 = 10,
            x2 = 340,
            y2 = 90
        const d = buildBezierPath(x1, y1, x2, y2, false)
        const [, , cp1x, cp1y, cp2x, cp2y] = extractNumbers(d)

        const expectedX = cubicBezierAt(0.5, x1, cp1x, cp2x, x2)
        const expectedY = cubicBezierAt(0.5, y1, cp1y, cp2y, y2)

        const mid = getBezierMidpoint(x1, y1, x2, y2, false)
        expect(mid.x).toBeCloseTo(expectedX)
        expect(mid.y).toBeCloseTo(expectedY)
    })

    it('lies between the endpoints on the y-axis for a simple connection', () => {
        const mid = getBezierMidpoint(0, 0, 100, 200, false)
        expect(mid.y).toBeGreaterThan(0)
        expect(mid.y).toBeLessThan(200)
    })

    it('bows away from the shared y for a near-level connection, so the delete marker sits on the visible curve', () => {
        const mid = getBezierMidpoint(0, 50, 100, 50, false)
        expect(mid.y).not.toBe(50)
        expect(mid.y - 50).toBeCloseTo(18) // 0.75 * MAX_VERTICAL_BOW, from the t=0.5 bezier blend
    })
})
