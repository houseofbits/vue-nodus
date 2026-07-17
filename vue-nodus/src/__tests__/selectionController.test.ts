import { describe, it, expect, beforeEach } from 'vitest'
import SelectionController, { rectsIntersect } from '../models/SelectionController'
import NodusBaseNode from '../models/BaseNode'
import NodusPort from '../models/Port'
import NodusConnection from '../models/Connection'

function makeNode(componentId = 'test') {
    return new NodusBaseNode(componentId, [], [])
}

describe('rectsIntersect', () => {
    const base = { x: 0, y: 0, width: 100, height: 100 }

    it('returns true for overlapping rects', () => {
        expect(rectsIntersect(base, { x: 50, y: 50, width: 100, height: 100 })).toBe(true)
    })

    it('returns true when one rect fully contains the other', () => {
        expect(rectsIntersect(base, { x: 25, y: 25, width: 10, height: 10 })).toBe(true)
        expect(rectsIntersect({ x: 25, y: 25, width: 10, height: 10 }, base)).toBe(true)
    })

    it('returns true for rects sharing only an edge', () => {
        expect(rectsIntersect(base, { x: 100, y: 0, width: 50, height: 100 })).toBe(true)
    })

    it('returns false for horizontally disjoint rects', () => {
        expect(rectsIntersect(base, { x: 101, y: 0, width: 50, height: 100 })).toBe(false)
    })

    it('returns false for vertically disjoint rects', () => {
        expect(rectsIntersect(base, { x: 0, y: 101, width: 100, height: 50 })).toBe(false)
    })
})

describe('SelectionController.selectMany', () => {
    let selection: SelectionController
    let a: NodusBaseNode
    let b: NodusBaseNode
    let c: NodusBaseNode

    beforeEach(() => {
        selection = new SelectionController()
        a = makeNode('a')
        b = makeNode('b')
        c = makeNode('c')
    })

    it('replaces the current selection when not additive', () => {
        selection.selectNode(a)

        selection.selectMany([b, c])

        expect(selection.isSelected(a)).toBe(false)
        expect(selection.isSelected(b)).toBe(true)
        expect(selection.isSelected(c)).toBe(true)
    })

    it('clears the selection when given an empty array', () => {
        selection.selectNode(a)

        selection.selectMany([])

        expect(selection.getSelected()).toEqual([])
    })

    it('appends without duplicating already-selected nodes when additive', () => {
        selection.selectNode(a)
        selection.selectNode(b, true)

        selection.selectMany([b, c], true)

        expect(selection.getSelected()).toHaveLength(3)
        expect(selection.isSelected(a)).toBe(true)
        expect(selection.isSelected(b)).toBe(true)
        expect(selection.isSelected(c)).toBe(true)
    })

    it('clears previously selected connections when none are passed', () => {
        const output = new NodusPort('number')
        const input = new NodusPort('number')
        const connection = new NodusConnection(output, input)
        selection.selectConnection(connection)

        selection.selectMany([a])

        expect(selection.getSelectedConnections()).toEqual([])
    })

    it('selects nodes and connections together', () => {
        const output = new NodusPort('number')
        const input = new NodusPort('number')
        const connection = new NodusConnection(output, input)

        selection.selectMany([a], false, [connection])

        expect(selection.isSelected(a)).toBe(true)
        expect(selection.isConnectionSelected(connection)).toBe(true)
    })

    it('appends connections without duplicates when additive', () => {
        const output = new NodusPort('number')
        const input = new NodusPort('number')
        const connection = new NodusConnection(output, input)
        selection.selectMany([], false, [connection])

        selection.selectMany([a], true, [connection])

        expect(selection.getSelectedConnections()).toHaveLength(1)
        expect(selection.isSelected(a)).toBe(true)
    })
})
