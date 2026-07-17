import { describe, it, expect, vi, beforeEach } from 'vitest'
import NodusGraph from '../models/Graph'
import NodusBaseNode from '../models/BaseNode'
import NodusPort from '../models/Port'
import NodusConnection from '../models/Connection'
import NodusConnectionType from '../models/connectionTypes/ConnectionType'

function makeNode(componentId = 'test', inputs: NodusPort[] = [], outputs: NodusPort[] = []) {
    return new NodusBaseNode(componentId, inputs, outputs)
}

/** Waits for every pending reactive flush (however many microtask layers deep) to settle. */
function flush(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0))
}

class RecordingNode extends NodusBaseNode {
    calls: unknown[][] = []
    compute() {
        this.calls.push(this.inputs.map((p) => p.value))
    }
}

class PassThroughNode extends NodusBaseNode {
    constructor(id: string) {
        super(id, [new NodusPort('number')], [new NodusPort('number')])
    }
    compute() {
        this.outputs[0].value = this.inputs[0].value
    }
}

class ConnectionRecordingNode extends NodusBaseNode {
    connected: unknown[][] = []
    disconnected: unknown[][] = []
    onPortConnected(port: NodusPort, otherNode: NodusBaseNode, otherPort: NodusPort) {
        this.connected.push([port, otherNode, otherPort])
    }
    onPortDisconnected(port: NodusPort, otherNode: NodusBaseNode, otherPort: NodusPort) {
        this.disconnected.push([port, otherNode, otherPort])
    }
}

describe('Graph', () => {
    let graph: NodusGraph

    beforeEach(() => {
        graph = new NodusGraph()
    })

    describe('addNode / removeNode', () => {
        it('adds a node to the graph', () => {
            const node = makeNode()
            graph.addNode(node)
            expect(graph.nodes.has(node.id)).toBe(true)
        })

        it('indexes ports so getNodeByPortId works', () => {
            const input = new NodusPort('number')
            const output = new NodusPort('number')
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
            const output = new NodusPort('number')
            const input = new NodusPort('number')
            const src = makeNode('src', [], [output])
            const tgt = makeNode('tgt', [input], [])
            graph.addNode(src)
            graph.addNode(tgt)
            const conn = new NodusConnection(output, input)
            graph.addConnection(conn)
            expect(graph.connections.size).toBe(1)

            graph.removeNode(src.id)
            expect(graph.connections.size).toBe(0)
        })

        it('does nothing when removing a non-existent node', () => {
            expect(() => graph.removeNode('nonexistent-id')).not.toThrow()
        })

        it('sets node.graph on addNode and clears it on removeNode', () => {
            const node = makeNode()
            graph.addNode(node)
            expect(node.graph).toBe(graph)

            graph.removeNode(node.id)
            expect(node.graph).toBeUndefined()
        })

        it('preserves node.graph identity through the reactive nodes Map (markRaw regression)', () => {
            const node = makeNode()
            graph.addNode(node)

            const fetched = graph.nodes.get(node.id)!
            expect(fetched.graph).toBe(graph)
        })
    })

    describe('addConnection / removeConnection', () => {
        it('adds a connection', () => {
            const output = new NodusPort('number')
            const input = new NodusPort('number')
            const src = makeNode('src', [], [output])
            const tgt = makeNode('tgt', [input], [])
            graph.addNode(src)
            graph.addNode(tgt)

            const conn = new NodusConnection(output, input)
            graph.addConnection(conn)
            expect(graph.connections.has(conn.id)).toBe(true)
        })

        it('removes a connection', () => {
            const output = new NodusPort('number')
            const input = new NodusPort('number')
            const src = makeNode('src', [], [output])
            const tgt = makeNode('tgt', [input], [])
            graph.addNode(src)
            graph.addNode(tgt)

            const conn = new NodusConnection(output, input)
            graph.addConnection(conn)
            graph.removeConnection(conn.id)
            expect(graph.connections.has(conn.id)).toBe(false)
        })

        it('syncs initial value from source to target on addConnection', () => {
            const output = new NodusPort('number', 'white', false, 42)
            const input = new NodusPort('number')
            const src = makeNode('src', [], [output])
            const tgt = makeNode('tgt', [input], [])
            graph.addNode(src)
            graph.addNode(tgt)

            graph.addConnection(new NodusConnection(output, input))
            expect(input.value).toBe(42)
        })

        it('calls onPortConnected on both source and target nodes with correct arguments', () => {
            const output = new NodusPort('number')
            const input = new NodusPort('number')
            const src = new ConnectionRecordingNode('src', [], [output])
            const tgt = new ConnectionRecordingNode('tgt', [input], [])
            graph.addNode(src)
            graph.addNode(tgt)

            const conn = new NodusConnection(output, input)
            graph.addConnection(conn)

            expect(src.connected).toEqual([[output, tgt, input]])
            expect(tgt.connected).toEqual([[input, src, output]])
            expect(src.disconnected).toEqual([])
            expect(tgt.disconnected).toEqual([])
        })

        it('calls onPortDisconnected on both source and target nodes on removeConnection', () => {
            const output = new NodusPort('number')
            const input = new NodusPort('number')
            const src = new ConnectionRecordingNode('src', [], [output])
            const tgt = new ConnectionRecordingNode('tgt', [input], [])
            graph.addNode(src)
            graph.addNode(tgt)

            const conn = new NodusConnection(output, input)
            graph.addConnection(conn)

            graph.removeConnection(conn.id)

            expect(src.disconnected).toEqual([[output, tgt, input]])
            expect(tgt.disconnected).toEqual([[input, src, output]])
        })

        it('calls onPortDisconnected on both nodes when the connection is removed via removeNode cascade', () => {
            const output = new NodusPort('number')
            const input = new NodusPort('number')
            const src = new ConnectionRecordingNode('src', [], [output])
            const tgt = new ConnectionRecordingNode('tgt', [input], [])
            graph.addNode(src)
            graph.addNode(tgt)

            const conn = new NodusConnection(output, input)
            graph.addConnection(conn)

            graph.removeNode(src.id)

            expect(src.disconnected).toEqual([[output, tgt, input]])
            expect(tgt.disconnected).toEqual([[input, src, output]])
        })

        it('does not fire callbacks on unrelated nodes when a different connection is removed', () => {
            const outA = new NodusPort('number')
            const inA = new NodusPort('number')
            const outB = new NodusPort('number')
            const inB = new NodusPort('number')
            const srcA = new ConnectionRecordingNode('srcA', [], [outA])
            const tgtA = new ConnectionRecordingNode('tgtA', [inA], [])
            const srcB = new ConnectionRecordingNode('srcB', [], [outB])
            const tgtB = new ConnectionRecordingNode('tgtB', [inB], [])
            graph.addNode(srcA)
            graph.addNode(tgtA)
            graph.addNode(srcB)
            graph.addNode(tgtB)

            const connA = new NodusConnection(outA, inA)
            const connB = new NodusConnection(outB, inB)
            graph.addConnection(connA)
            graph.addConnection(connB)

            graph.removeConnection(connB.id)

            expect(srcB.disconnected).toEqual([[outB, tgtB, inB]])
            expect(tgtB.disconnected).toEqual([[inB, srcB, outB]])
            expect(srcA.disconnected).toEqual([])
            expect(tgtA.disconnected).toEqual([])
        })

        it('does not throw when removing a non-existent connection', () => {
            expect(() => graph.removeConnection('nonexistent-id')).not.toThrow()
        })
    })

    describe('getSourceNodes', () => {
        it('returns the upstream node for a connected input port', () => {
            const output = new NodusPort('number')
            const input = new NodusPort('number')
            const src = makeNode('src', [], [output])
            const tgt = makeNode('tgt', [input], [])
            graph.addNode(src)
            graph.addNode(tgt)
            graph.addConnection(new NodusConnection(output, input))

            expect(graph.getSourceNodes(input)).toEqual([src])
        })

        it('returns an empty array for an unconnected input port', () => {
            const input = new NodusPort('number')
            const tgt = makeNode('tgt', [input], [])
            graph.addNode(tgt)

            expect(graph.getSourceNodes(input)).toEqual([])
        })

        it('returns all upstream nodes for a multiport input with multiple connections', () => {
            const outA = new NodusPort('number')
            const outB = new NodusPort('number')
            const input = new NodusPort('number', 'white', true)
            const srcA = makeNode('srcA', [], [outA])
            const srcB = makeNode('srcB', [], [outB])
            const tgt = makeNode('tgt', [input], [])
            graph.addNode(srcA)
            graph.addNode(srcB)
            graph.addNode(tgt)
            graph.addConnection(new NodusConnection(outA, input))
            graph.addConnection(new NodusConnection(outB, input))

            expect(graph.getSourceNodes(input)).toEqual(expect.arrayContaining([srcA, srcB]))
            expect(graph.getSourceNodes(input)).toHaveLength(2)
        })
    })

    describe('reactive compute propagation', () => {
        it('computes the target node once when a single upstream value changes', async () => {
            const output = new NodusPort('number', 'white', false, 0)
            const src = makeNode('src', [], [output])
            const tgt = new RecordingNode('tgt', [new NodusPort('number')], [])
            graph.addNode(src)
            graph.addNode(tgt)
            graph.addConnection(new NodusConnection(output, tgt.inputs[0]))

            output.value = 5
            await flush()

            expect(tgt.calls).toEqual([[5]])
        })

        it('computes a convergent node once with both fresh inputs when fed by paths of unequal length', async () => {
            // a -> b1 -> c(in0)              (2 hops to c)
            // a -> b2 -> b3 -> c(in1)        (3 hops to c)
            const a = makeNode('a', [], [new NodusPort('number', 'white', false, 0)])
            const b1 = new PassThroughNode('b1')
            const b2 = new PassThroughNode('b2')
            const b3 = new PassThroughNode('b3')
            const c = new RecordingNode('c', [new NodusPort('number'), new NodusPort('number')], [])

            for (const n of [a, b1, b2, b3, c]) graph.addNode(n)

            graph.addConnection(new NodusConnection(a.outputs[0], b1.inputs[0]))
            graph.addConnection(new NodusConnection(b1.outputs[0], c.inputs[0]))
            graph.addConnection(new NodusConnection(a.outputs[0], b2.inputs[0]))
            graph.addConnection(new NodusConnection(b2.outputs[0], b3.inputs[0]))
            graph.addConnection(new NodusConnection(b3.outputs[0], c.inputs[1]))

            a.outputs[0].value = 10
            await flush()

            expect(c.calls).toEqual([[10, 10]])
        })

        it('batches multiple simultaneous root triggers so each affected node computes once', async () => {
            const outA = new NodusPort('number', 'white', false, 0)
            const outB = new NodusPort('number', 'white', false, 0)
            const srcA = makeNode('srcA', [], [outA])
            const srcB = makeNode('srcB', [], [outB])
            const tgtA = new RecordingNode('tgtA', [new NodusPort('number')], [])
            const tgtB = new RecordingNode('tgtB', [new NodusPort('number')], [])
            graph.addNode(srcA)
            graph.addNode(srcB)
            graph.addNode(tgtA)
            graph.addNode(tgtB)
            graph.addConnection(new NodusConnection(outA, tgtA.inputs[0]))
            graph.addConnection(new NodusConnection(outB, tgtB.inputs[0]))

            outA.value = 1
            outB.value = 2
            await flush()

            expect(tgtA.calls).toEqual([[1]])
            expect(tgtB.calls).toEqual([[2]])
        })

        it('evaluate() still computes synchronously in topological order', () => {
            const output = new NodusPort('number', 'white', false, 7)
            const src = makeNode('src', [], [output])
            const tgt = new RecordingNode('tgt', [new NodusPort('number')], [])
            graph.addNode(src)
            graph.addNode(tgt)
            graph.addConnection(new NodusConnection(output, tgt.inputs[0]))

            tgt.calls = []
            graph.evaluate()

            expect(tgt.calls).toEqual([[7]])
        })

        it('does not throw if a connection is removed while its target node is pending in the dirty set', async () => {
            const output = new NodusPort('number')
            const input = new NodusPort('number')
            const src = makeNode('src', [], [output])
            const tgt = new RecordingNode('tgt', [input], [])
            graph.addNode(src)
            graph.addNode(tgt)
            const conn = new NodusConnection(output, input)
            graph.addConnection(conn)

            ;(graph as any).markDirty(tgt.id)
            expect(() => graph.removeConnection(conn.id)).not.toThrow()

            await expect(flush()).resolves.toBeUndefined()
        })

        it('does not throw if a node is removed while it is pending in the dirty set', async () => {
            const output = new NodusPort('number')
            const input = new NodusPort('number')
            const src = makeNode('src', [], [output])
            const tgt = new RecordingNode('tgt', [input], [])
            graph.addNode(src)
            graph.addNode(tgt)
            graph.addConnection(new NodusConnection(output, input))

            ;(graph as any).markDirty(tgt.id)
            expect(() => graph.removeNode(tgt.id)).not.toThrow()

            await expect(flush()).resolves.toBeUndefined()
        })
    })

    describe('selectPort warnings', () => {
        it('warns when connecting two input ports', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

            const nodeA = makeNode('a', [new NodusPort('number')], [])
            const nodeB = makeNode('b', [new NodusPort('number')], [])
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

            const nodeA = makeNode('a', [], [new NodusPort('number')])
            const nodeB = makeNode('b', [], [new NodusPort('number')])
            graph.addNode(nodeA)
            graph.addNode(nodeB)

            graph.selectPort(nodeA.outputs[0])
            graph.selectPort(nodeB.outputs[0])

            expect(warn).toHaveBeenCalledWith(expect.stringContaining('outputs'))
            warn.mockRestore()
        })

        it('warns on port type mismatch', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

            const nodeA = makeNode('a', [], [new NodusPort('number')])
            const nodeB = makeNode('b', [new NodusPort('string')], [])
            graph.addNode(nodeA)
            graph.addNode(nodeB)

            graph.selectPort(nodeA.outputs[0])
            graph.selectPort(nodeB.inputs[0])

            expect(warn).toHaveBeenCalledWith(expect.stringContaining('incompatible'))
            warn.mockRestore()
        })

        it('warns when connecting to a non-multiport that already has a connection', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

            const src1 = makeNode('s1', [], [new NodusPort('number')])
            const src2 = makeNode('s2', [], [new NodusPort('number')])
            const tgt = makeNode('t', [new NodusPort('number')], [])
            graph.addNode(src1)
            graph.addNode(src2)
            graph.addNode(tgt)

            graph.addConnection(new NodusConnection(src1.outputs[0], tgt.inputs[0]))

            graph.selectPort(src2.outputs[0])
            graph.selectPort(tgt.inputs[0])

            expect(warn).toHaveBeenCalledWith(expect.stringContaining('already has a connection'))
            warn.mockRestore()
        })

        it('does not warn on a valid connection', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

            const src = makeNode('src', [], [new NodusPort('number')])
            const tgt = makeNode('tgt', [new NodusPort('number')], [])
            graph.addNode(src)
            graph.addNode(tgt)

            graph.selectPort(src.outputs[0])
            graph.selectPort(tgt.inputs[0])

            expect(warn).not.toHaveBeenCalled()
            warn.mockRestore()
        })
    })

    describe('connection type resolver', () => {
        function connectAndGetConnection(): NodusConnection {
            const src = makeNode('src', [], [new NodusPort('number')])
            const tgt = makeNode('tgt', [new NodusPort('number')], [])
            graph.addNode(src)
            graph.addNode(tgt)

            graph.selectPort(src.outputs[0])
            graph.selectPort(tgt.inputs[0])

            return [...graph.connections.values()][0]
        }

        it('falls back to "bezier" when no resolver is registered', () => {
            const conn = connectAndGetConnection()
            expect(conn.connectionType).toBe('bezier')
        })

        it('falls back to "bezier" when the resolver returns undefined', () => {
            graph.registerConnectionTypeResolver(() => undefined)
            const conn = connectAndGetConnection()
            expect(conn.connectionType).toBe('bezier')
        })

        it('uses the string returned by the resolver as the connectionType', () => {
            graph.registerConnectionTypeResolver(() => 'straight')
            const conn = connectAndGetConnection()
            expect(conn.connectionType).toBe('straight')
        })

        it('auto-registers a class returned by the resolver and stores its derived key', () => {
            class CustomType extends NodusConnectionType {
                buildPath(x1: number, y1: number, x2: number, y2: number): string {
                    return `M ${x1} ${y1} L ${x2} ${y2}`
                }
                getMidpoint(x1: number, y1: number, x2: number, y2: number) {
                    return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 }
                }
            }
            graph.registerConnectionTypeResolver(() => CustomType)

            const conn = connectAndGetConnection()
            expect(conn.connectionType).toBe('CustomType')
            expect(graph.connectionTypeRegistry.get('CustomType')).toBeInstanceOf(CustomType)
        })

        it('is not invoked when a connection is added directly via addConnection()', () => {
            const resolver = vi.fn(() => 'straight')
            graph.registerConnectionTypeResolver(resolver)

            const src = makeNode('src', [], [new NodusPort('number')])
            const tgt = makeNode('tgt', [new NodusPort('number')], [])
            graph.addNode(src)
            graph.addNode(tgt)

            const conn = new NodusConnection(src.outputs[0], tgt.inputs[0])
            graph.addConnection(conn)

            expect(resolver).not.toHaveBeenCalled()
            expect(conn.connectionType).toBe('bezier')
        })
    })
})
