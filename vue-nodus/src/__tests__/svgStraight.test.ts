import { describe, it, expect } from 'vitest'
import { buildStraightPath, getStraightMidpoint } from '../helpers/svgStraight'

describe('buildStraightPath', () => {
    it('builds a single line segment between the two endpoints', () => {
        expect(buildStraightPath(0, 0, 100, 50)).toBe('M 0 0 L 100 50')
    })
})

describe('getStraightMidpoint', () => {
    it('returns the arithmetic midpoint of the two endpoints', () => {
        expect(getStraightMidpoint(0, 0, 100, 50)).toEqual({ x: 50, y: 25 })
    })

    it('lies exactly on the line between the endpoints', () => {
        const x1 = 20,
            y1 = 10,
            x2 = 340,
            y2 = 90
        const mid = getStraightMidpoint(x1, y1, x2, y2)

        // Slope from p1 to mid must equal slope from p1 to p2 (collinearity check).
        const slopeToMid = (mid.y - y1) / (mid.x - x1)
        const slopeToEnd = (y2 - y1) / (x2 - x1)
        expect(slopeToMid).toBeCloseTo(slopeToEnd)
    })
})
