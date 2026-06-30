import { describe, it, expect } from 'vitest'
import NodusBoard from '../models/Board'
import NodusBaseNode from '../models/BaseNode'
import NodusPort from '../models/Port'
import NodusConnection from '../models/Connection'

function makeSimpleNode(componentId: string) {
    return new NodusBaseNode(componentId, [new NodusPort('number')], [new NodusPort('number')])
}

describe('Serializer', () => {
    it('serialize returns nodes, connections, and board sections', () => {
        const board = new NodusBoard()
        const node = makeSimpleNode('test')
        board.graph.addNode(node)

        const data = board.serializer.serialize()
        expect(data).toHaveProperty('nodes')
        expect(data).toHaveProperty('connections')
        expect(data).toHaveProperty('board')
        expect(data.board).toHaveProperty('panX')
        expect(data.board).toHaveProperty('panY')
        expect(data.board).toHaveProperty('zoom')
    })

    it('serializes node positions', () => {
        const board = new NodusBoard()
        const node = makeSimpleNode('test')
        node.setPosition(123, 456)
        board.graph.addNode(node)

        const data = board.serializer.serialize()
        const savedNode = Object.values(data.nodes)[0] as any
        expect(savedNode.x).toBe(123)
        expect(savedNode.y).toBe(456)
    })

    it('serializes connections', () => {
        const board = new NodusBoard()
        const src = new NodusBaseNode('src', [], [new NodusPort('number')])
        const tgt = new NodusBaseNode('tgt', [new NodusPort('number')], [])
        board.graph.addNode(src)
        board.graph.addNode(tgt)
        board.graph.addConnection(new NodusConnection(src.outputs[0], tgt.inputs[0]))

        const data = board.serializer.serialize()
        expect(Object.keys(data.connections)).toHaveLength(1)
    })

    it('deserialize restores nodes with correct positions', () => {
        const board = new NodusBoard()
        const node = makeSimpleNode('test')
        node.setPosition(77, 88)
        board.graph.addNode(node)

        const data = board.serializer.serialize()
        board.serializer.deserialize(data, (componentId) => makeSimpleNode(componentId))

        expect(board.graph.nodes.size).toBe(1)
        const restored = [...board.graph.nodes.values()][0]
        expect(restored.internalState.x).toBe(77)
        expect(restored.internalState.y).toBe(88)
    })

    it('deserialize restores connections', () => {
        const board = new NodusBoard()
        const src = new NodusBaseNode('src', [], [new NodusPort('number')])
        const tgt = new NodusBaseNode('tgt', [new NodusPort('number')], [])
        board.graph.addNode(src)
        board.graph.addNode(tgt)
        board.graph.addConnection(new NodusConnection(src.outputs[0], tgt.inputs[0]))

        const data = board.serializer.serialize()

        board.serializer.deserialize(data, (componentId) => {
            if (componentId === 'src') return new NodusBaseNode('src', [], [new NodusPort('number')])
            return new NodusBaseNode('tgt', [new NodusPort('number')], [])
        })

        expect(board.graph.connections.size).toBe(1)
    })

    it('deserialize clears the existing graph first', () => {
        const board = new NodusBoard()
        board.graph.addNode(makeSimpleNode('test'))
        board.graph.addNode(makeSimpleNode('test'))

        const data = board.serializer.serialize()
        board.graph.addNode(makeSimpleNode('extra'))
        expect(board.graph.nodes.size).toBe(3)

        board.serializer.deserialize(data, (id) => makeSimpleNode(id))
        expect(board.graph.nodes.size).toBe(2)
    })
})
