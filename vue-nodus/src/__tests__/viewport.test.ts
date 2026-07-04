import { describe, it, expect } from 'vitest'
import Viewport from '../models/Viewport'

describe('Viewport', () => {
    it('pinch zooming in around a point keeps that point fixed on screen', () => {
        const viewport = new Viewport()

        const worldBefore = viewport.screenToWorld(100, 100)

        viewport.pinchStart(100)
        viewport.applyPinch(200, 100, 100)

        const worldAfter = viewport.screenToWorld(100, 100)

        expect(viewport.state.zoom).toBeCloseTo(2)
        expect(worldAfter.x).toBeCloseTo(worldBefore.x)
        expect(worldAfter.y).toBeCloseTo(worldBefore.y)
    })

    it('pinch zooming out decreases zoom proportionally to distance shrink', () => {
        const viewport = new Viewport()

        viewport.pinchStart(200)
        viewport.applyPinch(100, 0, 0)

        expect(viewport.state.zoom).toBeCloseTo(0.5)
    })

    it('clamps pinch zoom to the same [0.3, 3] range as wheel zoom', () => {
        const viewport = new Viewport()

        viewport.pinchStart(100)
        viewport.applyPinch(10000, 0, 0)
        expect(viewport.state.zoom).toBeCloseTo(3)

        viewport.pinchStart(100)
        viewport.applyPinch(0.01, 0, 0)
        expect(viewport.state.zoom).toBeCloseTo(0.3)
    })

    it('applyPinch is a no-op before pinchStart is called', () => {
        const viewport = new Viewport()

        viewport.applyPinch(200, 100, 100)

        expect(viewport.state.zoom).toBe(1)
    })
})
