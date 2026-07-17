import { describe, it, expect } from 'vitest'
import { buildSmoothStepPath, getSmoothStepMidpoint } from '../helpers/svgSmoothStep'
import { buildStepPath } from '../helpers/svgStep'

/** Extract every numeric literal (in source order) from an SVG path `d` string. */
function extractNumbers(d: string): number[] {
    return (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number)
}

describe('buildSmoothStepPath', () => {
    it('starts and ends exactly at the given endpoints', () => {
        const d = buildSmoothStepPath(0, 0, 100, 50)
        const numbers = extractNumbers(d)
        expect(numbers.slice(0, 2)).toEqual([0, 0])
        expect(numbers.slice(-2)).toEqual([100, 50])
    })

    it('rounds the corners with a radius clamped to half of dx and dy', () => {
        // dx = 100, dy = 8 -> radius bound by dy/2 = 4, well under MAX_CORNER_RADIUS (24).
        const d = buildSmoothStepPath(0, 0, 100, 8)
        expect(d).toContain('Q')
        const numbers = extractNumbers(d)
        // Corner should be within 4px of the horizontal midpoint's straight-line segments.
        const midX = 50
        expect(Math.abs(numbers[2] - midX)).toBeLessThanOrEqual(4)
    })

    it('clamps the radius to MAX_CORNER_RADIUS for large gaps', () => {
        const d = buildSmoothStepPath(0, 0, 400, 400)
        const numbers = extractNumbers(d)
        const midX = 200
        // First line-to point (before the first Q) should be exactly midX - 24.
        expect(numbers[2]).toBeCloseTo(midX - 24)
    })

    it('degrades to the sharp-corner step path when there is no room to round (dy = 0)', () => {
        expect(buildSmoothStepPath(0, 20, 100, 20)).toBe(buildStepPath(0, 20, 100, 20))
    })

    it('degrades to the sharp-corner step path when there is no room to round (dx = 0)', () => {
        expect(buildSmoothStepPath(50, 0, 50, 100)).toBe(buildStepPath(50, 0, 50, 100))
    })
})

describe('getSmoothStepMidpoint', () => {
    it('matches the sharp-corner step midpoint', () => {
        expect(getSmoothStepMidpoint(0, 0, 100, 50)).toEqual({ x: 50, y: 25 })
    })
})
