import { describe, it, expect, beforeEach } from 'vitest'
import NodusGraph from '../models/Graph'
import NodusBaseNode from '../models/BaseNode'
import NodusPort from '../models/Port'
import NodusConnection from '../models/Connection'

function makeNode(componentId = 'test', inputs: NodusPort[] = [], outputs: NodusPort[] = []) {
    return new NodusBaseNode(componentId, inputs, outputs)
}

/** Records what getParents()/getChildren() return from inside compute(), where `this` is the reactive-proxied node. */
class TopologyRecordingNode extends NodusBaseNode {
    parentsSeen: NodusBaseNode[] = []
    childrenSeen: NodusBaseNode[] = []
    compute() {
        this.parentsSeen = this.getParents(this.inputs[0])
        this.childrenSeen = this.getChildren(this.outputs[0])
    }
}

describe('NodusBaseNode', () => {
    let graph: NodusGraph

    beforeEach(() => {
        graph = new NodusGraph()
    })

    describe('getChildren / getParents', () => {
        it('return an empty array before the node is added to a graph', () => {
            const node = makeNode('n', [new NodusPort('number')], [new NodusPort('number')])
            expect(node.getChildren(node.outputs[0])).toEqual([])
            expect(node.getParents(node.inputs[0])).toEqual([])
        })

        it('return the connected neighbor after addNode + addConnection', () => {
            const output = new NodusPort('number')
            const input = new NodusPort('number')
            const src = makeNode('src', [], [output])
            const tgt = makeNode('tgt', [input], [])
            graph.addNode(src)
            graph.addNode(tgt)
            graph.addConnection(new NodusConnection(output, input))

            expect(src.getChildren(output)).toEqual([tgt])
            expect(tgt.getParents(input)).toEqual([src])
        })

        it('return all upstream nodes for a multiport input', () => {
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

            expect(tgt.getParents(input)).toEqual(expect.arrayContaining([srcA, srcB]))
            expect(tgt.getParents(input)).toHaveLength(2)
        })

        it('return an empty array again after removeNode', () => {
            const output = new NodusPort('number')
            const input = new NodusPort('number')
            const src = makeNode('src', [], [output])
            const tgt = makeNode('tgt', [input], [])
            graph.addNode(src)
            graph.addNode(tgt)
            graph.addConnection(new NodusConnection(output, input))

            graph.removeNode(src.id)
            expect(tgt.getParents(input)).toEqual([])
        })

        it('work correctly when called from inside compute() on the reactive-proxied node', () => {
            const output = new NodusPort('number', 'white', false, 1)
            const src = makeNode('src', [], [output])
            const mid = new TopologyRecordingNode(
                'mid',
                [new NodusPort('number')],
                [new NodusPort('number')],
            )
            const tgt = makeNode('tgt', [new NodusPort('number')], [])
            graph.addNode(src)
            graph.addNode(mid)
            graph.addNode(tgt)
            graph.addConnection(new NodusConnection(output, mid.inputs[0]))
            graph.addConnection(new NodusConnection(mid.outputs[0], tgt.inputs[0]))

            graph.evaluate()

            expect(mid.parentsSeen).toEqual([src])
            expect(mid.childrenSeen).toEqual([tgt])
        })
    })
})
