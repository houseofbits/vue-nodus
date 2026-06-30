import Connection from './Connection'
import BaseNode from './BaseNode'
import Port, { PortType } from './Port'
import { reactive, shallowRef, watch, type WatchStopHandle } from 'vue';

export default class Graph {
    nodes: Map<string, BaseNode> = reactive(new Map())
    connections: Map<string, Connection> = reactive(new Map())
    selectedPort = shallowRef<Port | null>(null)
    nextZIndex = 1

    private portToNode: Map<string, BaseNode> = new Map()
    private connectionWatchers: Map<string, WatchStopHandle> = new Map()
    private computingNodes: Set<string> = new Set()

    constructor() { }

    addNode(node: BaseNode) {
        this.nodes.set(node.id, node)
        for (const port of [...node.inputs, ...node.outputs]) {
            this.portToNode.set(port.id, node)
        }
    }

    removeNode(id: string) {
        const node = this.nodes.get(id)
        if (!node) return

        const portIds = new Set<string>([...node.inputs, ...node.outputs].map(p => p.id))
        for (const [connId, conn] of this.connections) {
            if (portIds.has(conn.sourcePortId) || portIds.has(conn.targetPortId)) {
                this.removeConnection(connId)
            }
        }

        for (const port of [...node.inputs, ...node.outputs]) {
            this.portToNode.delete(port.id)
        }
        this.nodes.delete(id)
    }

    addConnection(conn: Connection) {
        const sourcePort = this.findPort(conn.sourcePortId)
        const targetPort = this.findPort(conn.targetPortId)
        const targetNode = this.portToNode.get(conn.targetPortId)

        if (!sourcePort || !targetPort || !targetNode) return

        this.connections.set(conn.id, conn)

        targetPort.value = sourcePort.value

        const stop = watch(
            () => sourcePort.value,
            (newVal) => {
                targetPort.value = newVal
                if (!this.computingNodes.has(targetNode.id)) {
                    this.computingNodes.add(targetNode.id)
                    try {
                        targetNode.compute()
                    } finally {
                        this.computingNodes.delete(targetNode.id)
                    }
                }
            }
        )

        this.connectionWatchers.set(conn.id, stop)
    }

    removeConnection(id: string) {
        const stop = this.connectionWatchers.get(id)
        if (stop) {
            stop()
            this.connectionWatchers.delete(id)
        }
        this.connections.delete(id)
    }

    getNodeByPortId(portId: string): BaseNode | undefined {
        return this.portToNode.get(portId)
    }

    evaluate() {
        const order = this.topologicalSort()
        this.computingNodes.clear()
        for (const nodeId of order) {
            const node = this.nodes.get(nodeId)
            if (!node) continue
            this.syncInputs(node)
            node.compute()
        }
    }

    private findPort(portId: string): Port | undefined {
        const node = this.portToNode.get(portId)
        if (!node) return undefined
        return [...node.inputs, ...node.outputs].find(p => p.id === portId)
    }

    private syncInputs(node: BaseNode) {
        for (const inputPort of node.inputs) {
            const conn = [...this.connections.values()].find(c => c.targetPortId === inputPort.id)
            if (!conn) continue
            const sourcePort = this.findPort(conn.sourcePortId)
            if (sourcePort) {
                inputPort.value = sourcePort.value
            }
        }
    }

    private topologicalSort(): string[] {
        const downstream: Map<string, Set<string>> = new Map()
        const inDegree: Map<string, number> = new Map()

        for (const nodeId of this.nodes.keys()) {
            downstream.set(nodeId, new Set())
            inDegree.set(nodeId, 0)
        }

        for (const conn of this.connections.values()) {
            const srcNode = this.portToNode.get(conn.sourcePortId)
            const tgtNode = this.portToNode.get(conn.targetPortId)
            if (!srcNode || !tgtNode || srcNode.id === tgtNode.id) continue
            if (!downstream.get(srcNode.id)!.has(tgtNode.id)) {
                downstream.get(srcNode.id)!.add(tgtNode.id)
                inDegree.set(tgtNode.id, (inDegree.get(tgtNode.id) ?? 0) + 1)
            }
        }

        const queue: string[] = []
        for (const [id, deg] of inDegree) {
            if (deg === 0) queue.push(id)
        }

        const result: string[] = []
        while (queue.length > 0) {
            const id = queue.shift()!
            result.push(id)
            for (const downId of downstream.get(id) ?? []) {
                const newDeg = (inDegree.get(downId) ?? 0) - 1
                inDegree.set(downId, newDeg)
                if (newDeg === 0) queue.push(downId)
            }
        }

        // Append cycle nodes at the end so they still run once
        if (result.length < this.nodes.size) {
            for (const id of this.nodes.keys()) {
                if (!result.includes(id)) result.push(id)
            }
        }

        return result
    }

    selectPort(port: Port) {
        if (!this.selectedPort.value) {
            this.selectedPort.value = port

            return
        }

        if (this.selectedPort.value.id === port.id) {
            this.selectedPort.value = null;

            return
        }

        if (this.selectedPort.value.ioType === port.ioType) {
            this.selectedPort.value = null;

            return
        }

        if (this.selectedPort.value.type !== port.type) {
            this.selectedPort.value = null;

            return
        }

        const existing = [...this.connections.values()].find(
            con =>
                (con.sourcePortId === port.id &&
                    con.targetPortId === this.selectedPort.value?.id) ||
                (con.targetPortId === port.id &&
                    con.sourcePortId === this.selectedPort.value?.id)
        )

        if (existing) {
            this.selectedPort.value = null;

            return
        }

        let source = this.selectedPort.value
        let target = port

        if (port.ioType === PortType.Output) {
            source = port
            target = this.selectedPort.value
        }

        if (this.validateInputPortConnection(target)) {
            this.addConnection(new Connection(source, target, target.color))
        }

        this.selectedPort.value = null
    }

    clearPortSelection() {
        this.selectedPort.value = null
    }

    bringToFront(node: BaseNode) {
        node.setZIndex(this.nextZIndex++)
    }

    private validateInputPortConnection(port: Port) {
        if (port.isMultiport === false) {
            const value = [...this.connections.values()].find(con => con.targetPortId === port.id)
            if (value) {
                return false
            }
        }

        return true
    }

}