import { describe, it, expect, vi, beforeEach } from 'vitest'
import Graph from '../models/Graph'
import BaseNode from '../models/BaseNode'
import Port, { PortType } from '../models/Port'
import Connection from '../models/Connection'

function makeNode(componentId = 'test', inputs: Port[] = [], outputs: Port[] = []) {
    return new BaseNode(componentId, inputs, outputs)
}

describe('Graph', () => {
    let graph: Graph

    beforeEach(() => {
        graph = new Graph()
    })

    describe('addNode / removeNode', () => {
        it('adds a node to the graph', () => {
            const node = makeNode()
            graph.addNode(node)
            expect(graph.nodes.has(node.id)).toBe(true)
        })

        it('indexes ports so getNodeByPortId works', () => {
            const input = new Port('number')
            const output = new Port('number')
            const node = makeNode('test', [input], [output])
            graph.addNode(node)
            expect(graph.getNodeByPortId(input.id)).toBe(node)
            expect(graph.getNodeByPortId(output.id)).toBe(node)
        })

        it('removes the node', () => {
            const node = makeNode()
            graph.addNode(node)
            graph.removeNode(node.id)
            expect(graph.nodes.has(node.id)).toBe(false)
        })

        it('removes connections attached to the node on removeNode', () => {
            const output = new Port('number')
            const input = new Port('number')
            const src = makeNode('src', [], [output])
            const tgt = makeNode('tgt', [input], [])
            graph.addNode(src)
            graph.addNode(tgt)
            const conn = new Connection(output, input)
            graph.addConnection(conn)
            expect(graph.connections.size).toBe(1)

            graph.removeNode(src.id)
            expect(graph.connections.size).toBe(0)
        })

        it('does nothing when removing a non-existent node', () => {
            expect(() => graph.removeNode('nonexistent-id')).not.toThrow()
        })
    })

    describe('addConnection / removeConnection', () => {
        it('adds a connection', () => {
            const output = new Port('number')
            const input = new Port('number')
            const src = makeNode('src', [], [output])
            const tgt = makeNode('tgt', [input], [])
            graph.addNode(src)
            graph.addNode(tgt)

            const conn = new Connection(output, input)
            graph.addConnection(conn)
            expect(graph.connections.has(conn.id)).toBe(true)
        })

        it('removes a connection', () => {
            const output = new Port('number')
            const input = new Port('number')
            const src = makeNode('src', [], [output])
            const tgt = makeNode('tgt', [input], [])
            graph.addNode(src)
            graph.addNode(tgt)

            const conn = new Connection(output, input)
            graph.addConnection(conn)
            graph.removeConnection(conn.id)
            expect(graph.connections.has(conn.id)).toBe(false)
        })

        it('syncs initial value from source to target on addConnection', () => {
            const output = new Port('number', 'white', false, 42)
            const input = new Port('number')
            const src = makeNode('src', [], [output])
            const tgt = makeNode('tgt', [input], [])
            graph.addNode(src)
            graph.addNode(tgt)

            graph.addConnection(new Connection(output, input))
            expect(input.value).toBe(42)
        })
    })

    describe('selectPort warnings', () => {
        it('warns when connecting two input ports', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

            const nodeA = makeNode('a', [new Port('number')], [])
            const nodeB = makeNode('b', [new Port('number')], [])
            graph.addNode(nodeA)
            graph.addNode(nodeB)

            graph.selectPort(nodeA.inputs[0])
            graph.selectPort(nodeB.inputs[0])

            expect(warn).toHaveBeenCalledWith(expect.stringContaining('[vue-nodus]'))
            expect(warn).toHaveBeenCalledWith(expect.stringContaining('inputs'))
            warn.mockRestore()
        })

        it('warns when connecting two output ports', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

            const nodeA = makeNode('a', [], [new Port('number')])
            const nodeB = makeNode('b', [], [new Port('number')])
            graph.addNode(nodeA)
            graph.addNode(nodeB)

            graph.selectPort(nodeA.outputs[0])
            graph.selectPort(nodeB.outputs[0])

            expect(warn).toHaveBeenCalledWith(expect.stringContaining('outputs'))
            warn.mockRestore()
        })

        it('warns on port type mismatch', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

            const nodeA = makeNode('a', [], [new Port('number')])
            const nodeB = makeNode('b', [new Port('string')], [])
            graph.addNode(nodeA)
            graph.addNode(nodeB)

            graph.selectPort(nodeA.outputs[0])
            graph.selectPort(nodeB.inputs[0])

            expect(warn).toHaveBeenCalledWith(expect.stringContaining('incompatible'))
            warn.mockRestore()
        })

        it('warns when connecting to a non-multiport that already has a connection', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

            const src1 = makeNode('s1', [], [new Port('number')])
            const src2 = makeNode('s2', [], [new Port('number')])
            const tgt = makeNode('t', [new Port('number')], [])
            graph.addNode(src1)
            graph.addNode(src2)
            graph.addNode(tgt)

            graph.addConnection(new Connection(src1.outputs[0], tgt.inputs[0]))

            graph.selectPort(src2.outputs[0])
            graph.selectPort(tgt.inputs[0])

            expect(warn).toHaveBeenCalledWith(expect.stringContaining('already has a connection'))
            warn.mockRestore()
        })

        it('does not warn on a valid connection', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

            const src = makeNode('src', [], [new Port('number')])
            const tgt = makeNode('tgt', [new Port('number')], [])
            graph.addNode(src)
            graph.addNode(tgt)

            graph.selectPort(src.outputs[0])
            graph.selectPort(tgt.inputs[0])

            expect(warn).not.toHaveBeenCalled()
            warn.mockRestore()
        })
    })
})
