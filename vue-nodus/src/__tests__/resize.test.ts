import { describe, it, expect } from 'vitest'
import NodusBoard from '../models/Board'
import NodusBaseNode from '../models/BaseNode'
import NodusPort from '../models/Port'

function makeResizableNode(componentId: string, settings: { width?: number; height?: number } = {}) {
    return new NodusBaseNode(
        componentId,
        [new NodusPort('number')],
        [new NodusPort('number')],
        { isResizable: true, ...settings },
    )
}

function boardWithFactory() {
    const board = new NodusBoard()
    board.history.setNodeFactory((componentId, data) =>
        new NodusBaseNode(componentId, [new NodusPort('number')], [new NodusPort('number')], {
            isResizable: true,
            width: data.width,
            height: data.height,
        }),
    )
    return board
}

describe('resizing', () => {
    it('a click with no movement does not push an undo entry', () => {
        const board = boardWithFactory()
        const node = makeResizableNode('test', { width: 100, height: 60 })
        board.graph.addNode(node)

        const down = new MouseEvent('pointerdown', { clientX: 0, clientY: 0 })
        board.view.nodeResizeStart(node, down)
        board.view.onPointerUp(new PointerEvent('pointerup', { pointerId: 1 }))

        expect(board.history.canUndo()).toBe(false)
    })

    it('coalesces many onMove calls into exactly one undo entry, restoring the pre-resize size', () => {
        const board = boardWithFactory()
        const node = makeResizableNode('test', { width: 100, height: 60 })
        board.graph.addNode(node)

        const down = new MouseEvent('pointerdown', { clientX: 0, clientY: 0 })
        board.view.nodeResizeStart(node, down)

        for (let i = 1; i <= 5; i++) {
            board.view.onMove(new PointerEvent('pointermove', { clientX: i, clientY: i }))
        }

        board.view.onPointerUp(new PointerEvent('pointerup', { pointerId: 1 }))

        expect(node.internalState.width).toBe(105)
        expect(node.internalState.height).toBe(65)
        expect(board.history.canUndo()).toBe(true)

        board.history.undo()
        // deserialize() rebuilds node instances, so re-fetch rather than reuse the stale reference.
        const restored = [...board.graph.nodes.values()][0]
        expect(restored.internalState.width).toBe(100)
        expect(restored.internalState.height).toBe(60)
        expect(board.history.canUndo()).toBe(false)
    })

    it('clamps to a minimum size when dragged past it', () => {
        const board = boardWithFactory()
        const node = makeResizableNode('test', { width: 100, height: 60 })
        board.graph.addNode(node)

        const down = new MouseEvent('pointerdown', { clientX: 0, clientY: 0 })
        board.view.nodeResizeStart(node, down)
        board.view.onMove(new PointerEvent('pointermove', { clientX: -1000, clientY: -1000 }))
        board.view.onPointerUp(new PointerEvent('pointerup', { pointerId: 1 }))

        expect(node.internalState.width).toBe(60)
        expect(node.internalState.height).toBe(40)
    })

    it('switches an auto-sized node (null width/height) to an explicit size on first resize', () => {
        const board = boardWithFactory()
        const node = makeResizableNode('test')
        board.graph.addNode(node)

        expect(node.internalState.width).toBeNull()
        expect(node.internalState.height).toBeNull()

        const down = new MouseEvent('pointerdown', { clientX: 0, clientY: 0 })
        board.view.nodeResizeStart(node, down)
        // No boardElement is mounted in this test, so the node's size can't be measured from the
        // DOM - it falls back to the minimum size instead of staying null.
        board.view.onMove(new PointerEvent('pointermove', { clientX: 0, clientY: 0 }))

        expect(node.internalState.width).toBe(60)
        expect(node.internalState.height).toBe(40)
    })
})
