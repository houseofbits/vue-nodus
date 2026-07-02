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
})
