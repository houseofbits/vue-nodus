import { describe, it, expect, beforeEach } from 'vitest'
import View from '../models/View'
import NodusGraph from '../models/Graph'
import NodusBaseNode from '../models/BaseNode'
import NodusPort from '../models/Port'
import NodusConnection from '../models/Connection'

function makeNode(componentId = 'test') {
    return new NodusBaseNode(componentId, [], [])
}

function keyDownFrom(key: string, target: EventTarget) {
    const event = new KeyboardEvent('keydown', { key })
    Object.defineProperty(event, 'target', { value: target })
    return event
}

function pointerDown({ shiftKey = false, clientX = 0, clientY = 0 } = {}) {
    return new MouseEvent('pointerdown', { shiftKey, clientX, clientY })
}

function pointerEvent(
    type: string,
    {
        clientX = 0,
        clientY = 0,
        shiftKey = false,
        button = 0,
        target = document.createElement('div') as Element,
    } = {},
) {
    const event = new MouseEvent(type, { clientX, clientY, shiftKey, button })
    Object.defineProperty(event, 'target', { value: target })
    return event as unknown as PointerEvent
}

describe('View.onKeyDown', () => {
    let graph: NodusGraph
    let view: View
    let node: NodusBaseNode

    beforeEach(() => {
        graph = new NodusGraph()
        view = new View(graph)
        node = makeNode()
        graph.addNode(node)
        view.selection.selectNode(node)
    })

    it('does not delete the selected node when Backspace is pressed in an input', () => {
        const input = document.createElement('input')
        view.onKeyDown(keyDownFrom('Backspace', input))
        expect(graph.nodes.has(node.id)).toBe(true)
    })

    it('does not delete the selected node when Backspace is pressed in a textarea', () => {
        const textarea = document.createElement('textarea')
        view.onKeyDown(keyDownFrom('Backspace', textarea))
        expect(graph.nodes.has(node.id)).toBe(true)
    })

    it('does not delete the selected node when Backspace is pressed inside a contenteditable element', () => {
        const container = document.createElement('div')
        container.setAttribute('contenteditable', 'true')
        const span = document.createElement('span')
        container.appendChild(span)
        view.onKeyDown(keyDownFrom('Backspace', span))
        expect(graph.nodes.has(node.id)).toBe(true)
    })

    it('deletes the selected node when Backspace is pressed outside an editable element', () => {
        const div = document.createElement('div')
        view.onKeyDown(keyDownFrom('Backspace', div))
        expect(graph.nodes.has(node.id)).toBe(false)
    })

    it('deletes the selected node when Delete is pressed outside an editable element', () => {
        const div = document.createElement('div')
        view.onKeyDown(keyDownFrom('Delete', div))
        expect(graph.nodes.has(node.id)).toBe(false)
    })
})

describe('View.selectNode / View.nodeDragStart', () => {
    let graph: NodusGraph
    let view: View
    let node: NodusBaseNode

    beforeEach(() => {
        graph = new NodusGraph()
        view = new View(graph)
        node = makeNode()
        graph.addNode(node)
    })

    it('selectNode selects the node and brings it to front without arming a drag', () => {
        const zIndexBefore = node.internalState.zIndex

        view.selectNode(node, pointerDown())

        expect(view.selection.isSelected(node)).toBe(true)
        expect(node.internalState.zIndex).toBeGreaterThan(zIndexBefore)
        expect(view.state.isDraggingNode).toBe(false)
        expect(view.dragStartWorld).toBeNull()
    })

    it('nodeDragStart selects the node, brings it to front, and arms a drag', () => {
        const zIndexBefore = node.internalState.zIndex

        view.nodeDragStart(node, pointerDown({ clientX: 10, clientY: 20 }))

        expect(view.selection.isSelected(node)).toBe(true)
        expect(node.internalState.zIndex).toBeGreaterThan(zIndexBefore)
        expect(view.state.isDraggingNode).toBe(true)
        expect(view.dragStartWorld).not.toBeNull()
    })
})

describe('View drag-select (marquee)', () => {
    let graph: NodusGraph
    let view: View
    let inside: NodusBaseNode
    let outside: NodusBaseNode

    function dragSelect(from: { x: number; y: number }, to: { x: number; y: number }, shiftKey = false) {
        view.onPointerDown(pointerEvent('pointerdown', { clientX: from.x, clientY: from.y, shiftKey }))
        view.onMove(pointerEvent('pointermove', { clientX: to.x, clientY: to.y }))
        view.onPointerUp(pointerEvent('pointerup', { clientX: to.x, clientY: to.y }))
    }

    beforeEach(() => {
        graph = new NodusGraph()
        view = new View(graph)

        inside = new NodusBaseNode('inside', [], [], { width: 50, height: 40 })
        inside.setPosition(10, 10)
        graph.addNode(inside)

        outside = new NodusBaseNode('outside', [], [], { width: 50, height: 40 })
        outside.setPosition(500, 500)
        graph.addNode(outside)
    })

    it('arms box selection on a left pointerdown on empty canvas', () => {
        view.onPointerDown(pointerEvent('pointerdown', { clientX: 5, clientY: 7 }))

        expect(view.state.isBoxSelecting).toBe(true)
        expect(view.state.boxStartX).toBe(5)
        expect(view.state.boxStartY).toBe(7)
    })

    it('does not arm box selection when the pointerdown lands on a node', () => {
        const nodeEl = document.createElement('div')
        nodeEl.className = 'nodus-node'

        view.onPointerDown(pointerEvent('pointerdown', { target: nodeEl }))

        expect(view.state.isBoxSelecting).toBe(false)
    })

    it('selects exactly the nodes intersecting the dragged box', () => {
        dragSelect({ x: 0, y: 0 }, { x: 100, y: 100 })

        expect(view.selection.isSelected(inside)).toBe(true)
        expect(view.selection.isSelected(outside)).toBe(false)
        expect(view.state.isBoxSelecting).toBe(false)
        expect(view.suppressNextBoardClick).toBe(true)
    })

    it('clears the existing selection when dragging over empty space', () => {
        view.selection.selectNode(outside)

        dragSelect({ x: 200, y: 200 }, { x: 300, y: 300 })

        expect(view.selection.getSelected()).toEqual([])
    })

    it('adds to the existing selection when shift is held', () => {
        view.selection.selectNode(outside)

        dragSelect({ x: 0, y: 0 }, { x: 100, y: 100 }, true)

        expect(view.selection.isSelected(inside)).toBe(true)
        expect(view.selection.isSelected(outside)).toBe(true)
    })

    it('treats a sub-threshold drag as a plain click', () => {
        view.selection.selectNode(outside)

        dragSelect({ x: 50, y: 50 }, { x: 51, y: 51 })

        expect(view.selection.isSelected(outside)).toBe(true)
        expect(view.suppressNextBoardClick).toBe(false)
    })

    it('updates the selection live while dragging', () => {
        view.onPointerDown(pointerEvent('pointerdown', { clientX: 0, clientY: 0 }))

        view.onMove(pointerEvent('pointermove', { clientX: 100, clientY: 100 }))
        expect(view.selection.isSelected(inside)).toBe(true)

        // Shrink the box away from the node - it should deselect before pointerup.
        view.onMove(pointerEvent('pointermove', { clientX: 5, clientY: 5 }))
        expect(view.selection.isSelected(inside)).toBe(false)
    })

    it('keeps the pre-existing selection while shrinking a shift-drag box', () => {
        view.selection.selectNode(outside)

        view.onPointerDown(pointerEvent('pointerdown', { clientX: 0, clientY: 0, shiftKey: true }))
        view.onMove(pointerEvent('pointermove', { clientX: 100, clientY: 100 }))
        expect(view.selection.isSelected(inside)).toBe(true)
        expect(view.selection.isSelected(outside)).toBe(true)

        view.onMove(pointerEvent('pointermove', { clientX: 5, clientY: 5 }))
        expect(view.selection.isSelected(inside)).toBe(false)
        expect(view.selection.isSelected(outside)).toBe(true)
    })

    it('selects a connection whose bounding box intersects the box', () => {
        const output = new NodusPort('number')
        const source = new NodusBaseNode('source', [], [output], { width: 50, height: 40 })
        source.setPosition(1000, 200)
        graph.addNode(source)

        const input = new NodusPort('number')
        const target = new NodusBaseNode('target', [input], [], { width: 50, height: 40 })
        target.setPosition(1300, 200)
        graph.addNode(target)

        const connection = new NodusConnection(output, input)
        graph.addConnection(connection)

        // Bypass DOM measurement - set endpoint world positions directly.
        view.portRegistry.portPositions.set(output.id, { x: 1050, y: 220 })
        view.portRegistry.portPositions.set(input.id, { x: 1300, y: 220 })

        // Box crosses the middle of the line but touches neither node.
        dragSelect({ x: 1100, y: 210 }, { x: 1200, y: 230 })

        expect(view.selection.isConnectionSelected(connection)).toBe(true)
        expect(view.selection.isSelected(source)).toBe(false)
        expect(view.selection.isSelected(target)).toBe(false)
    })

    it('selects the correct nodes with a panned and zoomed viewport', () => {
        view.viewport.state.zoom = 2
        view.viewport.state.panX = 100
        view.viewport.state.panY = 50

        // Screen (100,50)-(300,250) maps to world (0,0)-(100,100), covering only `inside`.
        dragSelect({ x: 100, y: 50 }, { x: 300, y: 250 })

        expect(view.selection.isSelected(inside)).toBe(true)
        expect(view.selection.isSelected(outside)).toBe(false)
    })
})

describe('View.deleteNode / View.deleteConnection', () => {
    let graph: NodusGraph
    let view: View
    let source: NodusBaseNode
    let target: NodusBaseNode
    let connection: NodusConnection

    beforeEach(() => {
        graph = new NodusGraph()
        view = new View(graph)

        const output = new NodusPort('number')
        source = new NodusBaseNode('source', [], [output])
        graph.addNode(source)

        const input = new NodusPort('number')
        target = new NodusBaseNode('target', [input], [])
        graph.addNode(target)

        connection = new NodusConnection(output, input)
        graph.addConnection(connection)
    })

    it('deleteNode removes the node, its connections, and clears the selection', () => {
        view.selection.selectNode(source)

        view.deleteNode(source)

        expect(graph.nodes.has(source.id)).toBe(false)
        expect(graph.connections.has(connection.id)).toBe(false)
        expect(view.selection.getSelected()).toEqual([])
    })

    it('deleteConnection removes only the connection and clears the selection', () => {
        view.selection.selectConnection(connection)

        view.deleteConnection(connection)

        expect(graph.connections.has(connection.id)).toBe(false)
        expect(graph.nodes.has(source.id)).toBe(true)
        expect(graph.nodes.has(target.id)).toBe(true)
        expect(view.selection.getSelectedConnections()).toEqual([])
    })

    it('deleteSelected only removes the shift-clicked connection, not a previously selected node', () => {
        const output1 = new NodusPort('number')
        const output2 = new NodusPort('number')
        const hub = new NodusBaseNode('hub', [], [output1, output2])
        graph.addNode(hub)

        const input1 = new NodusPort('number')
        const sink1 = new NodusBaseNode('sink1', [input1], [])
        graph.addNode(sink1)

        const input2 = new NodusPort('number')
        const sink2 = new NodusBaseNode('sink2', [input2], [])
        graph.addNode(sink2)

        const hubConnection1 = new NodusConnection(output1, input1)
        const hubConnection2 = new NodusConnection(output2, input2)
        graph.addConnection(hubConnection1)
        graph.addConnection(hubConnection2)

        view.selection.selectNode(hub, false)
        view.selection.selectConnection(hubConnection1, true)

        view.deleteSelected()

        expect(graph.connections.has(hubConnection1.id)).toBe(false)
        expect(graph.connections.has(hubConnection2.id)).toBe(true)
        expect(graph.nodes.has(hub.id)).toBe(true)
        expect(graph.nodes.has(sink2.id)).toBe(true)
    })
})

describe('View.getSVGPath / View.getConnectionType', () => {
    let graph: NodusGraph
    let view: View
    let source: NodusBaseNode
    let target: NodusBaseNode
    let connection: NodusConnection

    beforeEach(() => {
        graph = new NodusGraph()
        view = new View(graph)

        const output = new NodusPort('number')
        source = new NodusBaseNode('source', [], [output])
        graph.addNode(source)

        const input = new NodusPort('number')
        target = new NodusBaseNode('target', [input], [])
        graph.addNode(target)

        connection = new NodusConnection(output, input)
        graph.addConnection(connection)

        // Bypass DOM measurement (register()) - set world positions directly for path math.
        view.portRegistry.portPositions.set(output.id, { x: 0, y: 0 })
        view.portRegistry.portPositions.set(input.id, { x: 100, y: 0 })
    })

    it('builds a straight-line path for a "straight"-typed connection, distinct from bezier', () => {
        connection.connectionType = 'straight'
        expect(view.getSVGPath(connection)).toBe('M 0 0 L 100 0')

        connection.connectionType = 'bezier'
        expect(view.getSVGPath(connection)).not.toBe('M 0 0 L 100 0')
    })

    it('falls back to bezier for an unregistered/stale connectionType', () => {
        connection.connectionType = 'some-unregistered-type'
        expect(view.getConnectionType(connection)).toBe(view.connectionTypeRegistry.get('bezier'))
    })
})
