import { describe, it, expect, vi } from 'vitest'
import NodusBoard from '../models/Board'
import NodusHistory from '../models/History'
import NodusBaseNode from '../models/BaseNode'
import NodusPort from '../models/Port'

function makeSimpleNode(componentId: string) {
    return new NodusBaseNode(componentId, [new NodusPort('number')], [new NodusPort('number')])
}

function makeTitledNode(componentId: string, title: string) {
    return new NodusBaseNode(
        componentId,
        [new NodusPort('number')],
        [new NodusPort('number')],
        { title },
    )
}

function boardWithFactory() {
    const board = new NodusBoard()
    board.history.setNodeFactory((componentId) => makeSimpleNode(componentId))
    return board
}

function keyDownFrom(key: string, target: EventTarget, opts: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean } = {}) {
    const event = new KeyboardEvent('keydown', { key, ...opts })
    Object.defineProperty(event, 'target', { value: target })
    return event
}

describe('NodusHistory', () => {
    it('undo()/redo() no-op on empty stacks without requiring a node factory', () => {
        const board = new NodusBoard()
        expect(board.history.canUndo()).toBe(false)
        expect(board.history.canRedo()).toBe(false)
        expect(() => board.history.undo()).not.toThrow()
        expect(() => board.history.redo()).not.toThrow()
    })

    it('undo() throws a clear error if called before setNodeFactory()', () => {
        const board = new NodusBoard()
        const node = makeSimpleNode('test')
        board.graph.addNode(node)
        board.view.deleteNode(node)

        expect(board.history.canUndo()).toBe(true)
        expect(() => board.history.undo()).toThrow(/setNodeFactory/)
    })

    it('deleteNode: undo restores the deleted node, redo re-deletes it', () => {
        const board = boardWithFactory()
        const node = makeSimpleNode('test')
        node.setPosition(10, 20)
        board.graph.addNode(node)

        board.view.deleteNode(node)
        expect(board.graph.nodes.has(node.id)).toBe(false)

        board.history.undo()
        expect(board.graph.nodes.size).toBe(1)
        const restored = [...board.graph.nodes.values()][0]
        expect(restored.internalState.x).toBe(10)
        expect(restored.internalState.y).toBe(20)

        board.history.redo()
        expect(board.graph.nodes.size).toBe(0)
    })

    it('deleteConnection: undo restores the deleted connection', () => {
        const board = boardWithFactory()
        const src = makeSimpleNode('src')
        const tgt = makeSimpleNode('tgt')
        board.graph.addNode(src)
        board.graph.addNode(tgt)
        board.graph.selectPort(src.outputs[0])
        board.graph.selectPort(tgt.inputs[0])

        const connectionId = [...board.graph.connections.keys()][0]
        // The connect above also pushed an undo point (selectPort snapshot). Clear it so this
        // test isolates the delete/undo behavior.
        board.history.undo()
        board.history.redo()

        board.view.deleteConnection(board.graph.connections.get(connectionId)!)
        expect(board.graph.connections.has(connectionId)).toBe(false)

        board.history.undo()
        expect(board.graph.connections.size).toBe(1)
    })

    it('deleteSelected with nothing selected does not push an undo entry', () => {
        const board = boardWithFactory()
        board.view.deleteSelected()
        expect(board.history.canUndo()).toBe(false)
    })

    it('drag: a click with no movement does not push an undo entry', () => {
        const board = boardWithFactory()
        const node = makeSimpleNode('test')
        board.graph.addNode(node)

        const down = new MouseEvent('pointerdown', { clientX: 0, clientY: 0 })
        board.view.nodeDragStart(node, down)
        board.view.onPointerUp(new PointerEvent('pointerup', { pointerId: 1 }))

        expect(board.history.canUndo()).toBe(false)
    })

    it('drag: coalesces many onMove calls into exactly one undo entry, restoring pre-drag position', () => {
        const board = boardWithFactory()
        const node = makeSimpleNode('test')
        node.setPosition(0, 0)
        board.graph.addNode(node)

        const down = new MouseEvent('pointerdown', { clientX: 0, clientY: 0 })
        board.view.nodeDragStart(node, down)

        for (let i = 1; i <= 5; i++) {
            board.view.onMove(new PointerEvent('pointermove', { clientX: i, clientY: i }))
        }

        board.view.onPointerUp(new PointerEvent('pointerup', { pointerId: 1 }))

        expect(board.history.canUndo()).toBe(true)
        expect(node.internalState.x).not.toBe(0)

        board.history.undo()
        // deserialize() rebuilds node instances, so re-fetch rather than reuse the stale reference.
        const restored = [...board.graph.nodes.values()][0]
        expect(restored.internalState.x).toBe(0)
        expect(restored.internalState.y).toBe(0)
        expect(board.history.canUndo()).toBe(false)
    })

    it('selectPort: connecting two ports pushes an undo point; a failed/incompatible attempt does not', () => {
        const board = boardWithFactory()
        const src = makeSimpleNode('src')
        const tgt = makeSimpleNode('tgt')
        board.graph.addNode(src)
        board.graph.addNode(tgt)

        // Selecting the same (output) port twice cancels the selection - no connection, no snapshot.
        board.graph.selectPort(src.outputs[0])
        board.graph.selectPort(src.outputs[0])
        expect(board.history.canUndo()).toBe(false)

        board.graph.selectPort(src.outputs[0])
        board.graph.selectPort(tgt.inputs[0])
        expect(board.graph.connections.size).toBe(1)
        expect(board.history.canUndo()).toBe(true)

        board.history.undo()
        expect(board.graph.connections.size).toBe(0)
    })

    it('caps the undo stack at maxSize, evicting the oldest entry', () => {
        const board = new NodusBoard()
        board.history = new NodusHistory(board.serializer, 2)
        board.history.setNodeFactory((componentId) => makeSimpleNode(componentId))
        board.graph.history = board.history
        board.view.history = board.history

        const nodeA = makeSimpleNode('a')
        const nodeB = makeSimpleNode('b')
        const nodeC = makeSimpleNode('c')
        board.graph.addNode(nodeA)
        board.graph.addNode(nodeB)
        board.graph.addNode(nodeC)

        // Push 3 undo entries back-to-back, with no undo() in between, so the cap actually evicts.
        board.view.deleteNode(nodeA) // should be evicted
        board.view.deleteNode(nodeB)
        board.view.deleteNode(nodeC)

        expect(board.history.canUndo()).toBe(true)
        board.history.undo()
        board.history.undo()
        // Only 2 undo steps were kept (the cap), so nodeA's deletion is unrecoverable.
        expect(board.graph.nodes.size).toBe(2)
        expect(board.history.canUndo()).toBe(false)
    })

    it('undo()/redo() recompute node outputs and recalculate port positions after restoring a snapshot', () => {
        const board = boardWithFactory()
        const node = makeSimpleNode('test')
        board.graph.addNode(node)
        board.view.deleteNode(node)

        const evaluateSpy = vi.spyOn(board.graph, 'evaluate')
        const updateAllSpy = vi.spyOn(board.view.portRegistry, 'scheduleUpdateAll')

        board.history.undo()
        expect(evaluateSpy).toHaveBeenCalledTimes(1)
        expect(updateAllSpy).toHaveBeenCalledTimes(1)

        board.history.redo()
        expect(evaluateSpy).toHaveBeenCalledTimes(2)
        expect(updateAllSpy).toHaveBeenCalledTimes(2)
    })

    it('a new action after an undo clears the redo stack', () => {
        const board = boardWithFactory()
        const nodeA = makeSimpleNode('a')
        const nodeB = makeSimpleNode('b')
        board.graph.addNode(nodeA)
        board.graph.addNode(nodeB)

        board.view.deleteNode(nodeA)
        board.history.undo()
        expect(board.history.canRedo()).toBe(true)

        board.view.deleteNode(nodeB)
        expect(board.history.canRedo()).toBe(false)
    })
})

describe('View.onKeyDown history shortcuts', () => {
    function boardWithDeletedNode() {
        const board = boardWithFactory()
        const node = makeSimpleNode('test')
        board.graph.addNode(node)
        board.view.deleteNode(node)
        return board
    }

    it('Ctrl+Z undoes', () => {
        const board = boardWithDeletedNode()
        const div = document.createElement('div')

        board.view.onKeyDown(keyDownFrom('z', div, { ctrlKey: true }))

        expect(board.graph.nodes.size).toBe(1)
    })

    it('Cmd+Z undoes (metaKey, for Mac)', () => {
        const board = boardWithDeletedNode()
        const div = document.createElement('div')

        board.view.onKeyDown(keyDownFrom('z', div, { metaKey: true }))

        expect(board.graph.nodes.size).toBe(1)
    })

    it('Ctrl+Shift+Z redoes', () => {
        const board = boardWithDeletedNode()
        const div = document.createElement('div')
        board.view.onKeyDown(keyDownFrom('z', div, { ctrlKey: true }))
        expect(board.graph.nodes.size).toBe(1)

        board.view.onKeyDown(keyDownFrom('z', div, { ctrlKey: true, shiftKey: true }))

        expect(board.graph.nodes.size).toBe(0)
    })

    it('Ctrl+Y redoes (Windows/Linux alternate)', () => {
        const board = boardWithDeletedNode()
        const div = document.createElement('div')
        board.view.onKeyDown(keyDownFrom('z', div, { ctrlKey: true }))
        expect(board.graph.nodes.size).toBe(1)

        board.view.onKeyDown(keyDownFrom('y', div, { ctrlKey: true }))

        expect(board.graph.nodes.size).toBe(0)
    })

    it('does not undo/redo when Ctrl+Z is pressed inside an editable target', () => {
        const board = boardWithDeletedNode()
        const input = document.createElement('input')

        board.view.onKeyDown(keyDownFrom('z', input, { ctrlKey: true }))

        expect(board.graph.nodes.size).toBe(0)
    })

    it('plain Z (no modifier) does not undo', () => {
        const board = boardWithDeletedNode()
        const div = document.createElement('div')

        board.view.onKeyDown(keyDownFrom('z', div))

        expect(board.graph.nodes.size).toBe(0)
    })
})

describe('NodusHistory.records labels', () => {
    function pointerDown({ clientX = 0, clientY = 0 } = {}) {
        return new MouseEvent('pointerdown', { clientX, clientY })
    }

    function pointerMove(clientX: number, clientY: number) {
        return new PointerEvent('pointermove', { clientX, clientY })
    }

    function pointerUp() {
        return new PointerEvent('pointerup', { pointerId: 1 })
    }

    it('deleting a titled node labels the record with its title', () => {
        const board = boardWithFactory()
        const node = makeTitledNode('test', 'My Title')
        board.graph.addNode(node)

        board.view.deleteNode(node)

        expect(board.history.records).toEqual([{ label: 'Node "My Title" deleted' }])
    })

    it('deleting an untitled node falls back to componentId', () => {
        const board = boardWithFactory()
        const node = makeSimpleNode('test')
        board.graph.addNode(node)

        board.view.deleteNode(node)

        expect(board.history.records).toEqual([{ label: 'Node "test" deleted' }])
    })

    it('deleteSelected with 2 nodes, no connections, labels "Node group deleted"', () => {
        const board = boardWithFactory()
        const nodeA = makeTitledNode('a', 'Add')
        const nodeB = makeTitledNode('b', 'Multiply')
        board.graph.addNode(nodeA)
        board.graph.addNode(nodeB)

        board.view.selection.selectNode(nodeA, false)
        board.view.selection.selectNode(nodeB, true)
        board.view.deleteSelected()

        expect(board.history.records).toEqual([{ label: 'Node group deleted' }])
    })

    it('deleteSelected with 1 connection selected labels it with both node names', () => {
        const board = boardWithFactory()
        const src = makeTitledNode('src', 'Add')
        const tgt = makeTitledNode('tgt', 'Multiply')
        board.graph.addNode(src)
        board.graph.addNode(tgt)
        board.graph.selectPort(src.outputs[0])
        board.graph.selectPort(tgt.inputs[0])
        const connection = [...board.graph.connections.values()][0]

        board.view.selection.selectConnection(connection)
        board.view.deleteSelected()

        expect(board.history.records.at(-1)).toEqual({ label: 'Connection "Add → Multiply" deleted' })
    })

    it('deleteSelected with 2 connections, no nodes, labels "N connections deleted"', () => {
        const board = boardWithFactory()
        const hub = makeSimpleNode('hub')
        const sink1 = makeSimpleNode('sink1')
        const sink2 = makeSimpleNode('sink2')
        board.graph.addNode(hub)
        board.graph.addNode(sink1)
        board.graph.addNode(sink2)
        board.graph.selectPort(hub.outputs[0])
        board.graph.selectPort(sink1.inputs[0])
        board.graph.selectPort(hub.outputs[0])
        board.graph.selectPort(sink2.inputs[0])
        const [connA, connB] = [...board.graph.connections.values()]

        board.view.selection.selectConnection(connA, false)
        board.view.selection.selectConnection(connB, true)
        board.view.deleteSelected()

        expect(board.history.records.at(-1)).toEqual({ label: '2 connections deleted' })
    })

    it('deleteSelected with a mix of nodes and connections labels "N items deleted"', () => {
        const board = boardWithFactory()
        const hub = makeSimpleNode('hub')
        const sink = makeSimpleNode('sink')
        const other = makeSimpleNode('other')
        board.graph.addNode(hub)
        board.graph.addNode(sink)
        board.graph.addNode(other)
        board.graph.selectPort(hub.outputs[0])
        board.graph.selectPort(sink.inputs[0])
        const connection = [...board.graph.connections.values()][0]

        // SelectionController.selectNode()/selectConnection() each clear the other selection type,
        // so a mixed selection can only be produced by writing to the refs directly (e.g. a
        // rubber-band multi-select), not through the normal click-to-select methods.
        board.view.selection.selectedNodes.value = [{ node: other, dragStartX: 0, dragStartY: 0 }]
        board.view.selection.selectedConnections.value = [connection]
        board.view.deleteSelected()

        expect(board.history.records.at(-1)).toEqual({ label: '2 items deleted' })
    })

    it('drag: single node labels "Node ... moved"; multi-select drag labels "Node group moved"', () => {
        const board = boardWithFactory()
        const nodeA = makeTitledNode('a', 'Add')
        const nodeB = makeTitledNode('b', 'Multiply')
        board.graph.addNode(nodeA)
        board.graph.addNode(nodeB)

        board.view.nodeDragStart(nodeA, pointerDown())
        board.view.onMove(pointerMove(10, 10))
        board.view.onPointerUp(pointerUp())

        expect(board.history.records.at(-1)).toEqual({ label: 'Node "Add" moved' })

        board.view.selection.selectNode(nodeA, false)
        board.view.selection.selectNode(nodeB, true)
        board.view.nodeDragStart(nodeA, pointerDown())
        board.view.onMove(pointerMove(20, 20))
        board.view.onPointerUp(pointerUp())

        expect(board.history.records.at(-1)).toEqual({ label: 'Node group moved' })
    })

    it('selectPort: connecting two titled nodes labels "Connected ... and ..."', () => {
        const board = boardWithFactory()
        const src = makeTitledNode('src', 'Add')
        const tgt = makeTitledNode('tgt', 'Multiply')
        board.graph.addNode(src)
        board.graph.addNode(tgt)

        board.graph.selectPort(src.outputs[0])
        board.graph.selectPort(tgt.inputs[0])

        expect(board.history.records).toEqual([{ label: 'Connected "Add" and "Multiply"' }])
    })

    it('records reflects undo/redo: label moves to redo and back with an undo/redo round-trip', () => {
        const board = boardWithFactory()
        const node = makeTitledNode('test', 'My Title')
        board.graph.addNode(node)
        board.view.deleteNode(node)

        expect(board.history.records).toEqual([{ label: 'Node "My Title" deleted' }])

        board.history.undo()
        expect(board.history.records).toEqual([])

        board.history.redo()
        expect(board.history.records).toEqual([{ label: 'Node "My Title" deleted' }])
    })

    it('records respects the maxSize cap - evicted entries disappear from records too', () => {
        const board = new NodusBoard()
        board.history = new NodusHistory(board.serializer, 2)
        board.history.setNodeFactory((componentId) => makeSimpleNode(componentId))
        board.graph.history = board.history
        board.view.history = board.history

        const nodeA = makeTitledNode('a', 'First')
        const nodeB = makeTitledNode('b', 'Second')
        const nodeC = makeTitledNode('c', 'Third')
        board.graph.addNode(nodeA)
        board.graph.addNode(nodeB)
        board.graph.addNode(nodeC)

        board.view.deleteNode(nodeA) // should be evicted once nodeC's delete pushes past the cap
        board.view.deleteNode(nodeB)
        board.view.deleteNode(nodeC)

        expect(board.history.records).toEqual([
            { label: 'Node "Second" deleted' },
            { label: 'Node "Third" deleted' },
        ])
    })
})
