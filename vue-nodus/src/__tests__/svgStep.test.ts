import { describe, it, expect } from 'vitest'
import { buildStepPath, getStepMidpoint, stepMidX } from '../helpers/svgStep'

describe('stepMidX', () => {
    it('is the horizontal midpoint between the two x-coordinates', () => {
        expect(stepMidX(0, 100)).toBe(50)
    })
})

describe('buildStepPath', () => {
    it('builds a two-corner orthogonal path through the horizontal midpoint', () => {
        expect(buildStepPath(0, 0, 100, 50)).toBe('M 0 0 H 50 V 50 H 100')
    })

    it('collapses to a straight horizontal segment when y1 === y2', () => {
        expect(buildStepPath(0, 20, 100, 20)).toBe('M 0 20 H 50 V 20 H 100')
    })
})

describe('getStepMidpoint', () => {
    it('sits on the vertical segment at the horizontal midpoint and vertical average', () => {
        expect(getStepMidpoint(0, 0, 100, 50)).toEqual({ x: 50, y: 25 })
    })
})
