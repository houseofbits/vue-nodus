import NodusConnection from './Connection'
import NodusBaseNode from './BaseNode'
import NodusPort, { NodusPortType } from './Port'
import { reactive, shallowRef, watch, nextTick, markRaw, type WatchStopHandle } from 'vue'
import NodusConnectionTypeRegistry, {
    type ConnectionTypeResolver,
} from './connectionTypes/ConnectionTypeRegistry.js'
import type NodusHistory from './History'
import { nodeDisplayName } from './History'

export default class NodusGraph {
    nodes: Map<string, NodusBaseNode> = reactive(new Map())
    connections: Map<string, NodusConnection> = reactive(new Map())
    selectedPort = shallowRef<NodusPort | null>(null)
    selectedPortIsTouch = shallowRef(false)
    nextZIndex = 1
    connectionTypeRegistry: NodusConnectionTypeRegistry
    /** Set by `NodusBoard` so interactive connection creation (`selectPort()`) can push an undo point. */
    history?: NodusHistory

    private connectionTypeResolver?: ConnectionTypeResolver
    private portToNode: Map<string, NodusBaseNode> = new Map()
    private connectionWatchers: Map<string, WatchStopHandle> = new Map()
    private computingNodes: Set<string> = new Set()
    private dirtyNodes: Set<string> = new Set()
    private flushScheduled: boolean = false

    constructor(connectionTypeRegistry: NodusConnectionTypeRegistry = new NodusConnectionTypeRegistry()) {
        this.connectionTypeRegistry = connectionTypeRegistry
        markRaw(this)
    }

    /**
     * Register a function that decides which connection type applies to a newly created
     * connection, based on the two ports being connected. Called only from `selectPort()`
     * (interactive connection creation) - never for connections added via `addConnection()`,
     * since those already carry an explicit/persisted type.
     */
    registerConnectionTypeResolver(resolver: ConnectionTypeResolver) {
        this.connectionTypeResolver = resolver
    }

    /** Add a node to the graph. The node's ports are indexed for fast lookup by ID. */
    addNode(node: NodusBaseNode) {
        this.nodes.set(node.id, node)
        node.graph = this
        for (const port of [...node.inputs, ...node.outputs]) {
            this.portToNode.set(port.id, node)
        }
    }

    /** Remove a node and all connections attached to any of its ports. */
    removeNode(id: string) {
        const node = this.nodes.get(id)
        if (!node) return

        const portIds = new Set<string>([...node.inputs, ...node.outputs].map((p) => p.id))
        for (const [connId, conn] of this.connections) {
            if (portIds.has(conn.sourcePortId) || portIds.has(conn.targetPortId)) {
                this.removeConnection(connId)
            }
        }

        for (const port of [...node.inputs, ...node.outputs]) {
            this.portToNode.delete(port.id)
        }
        this.nodes.delete(id)
        this.dirtyNodes.delete(id)
        node.graph = undefined
    }

    /**
     * Create a connection between two ports. Sets up a reactive watcher so the target port
     * value stays in sync with the source, and calls `compute()` on the target node on change.
     * Calls `onPortConnected()` on both the source and target node.
     * Use `NodusGraph.selectPort()` for interactive connection creation with built-in validation,
     * or call this directly when building connections programmatically (e.g. after deserialization).
     */
    addConnection(conn: NodusConnection) {
        const endpoints = this.resolveEndpoints(conn)
        if (!endpoints) return
        const { sourceNode, sourcePort, targetNode, targetPort } = endpoints

        this.connections.set(conn.id, conn)

        targetPort.value = sourcePort.value

        const stop = watch(
            () => sourcePort.value,
            (newVal) => {
                const alreadySynced = targetPort.value === newVal
                targetPort.value = newVal
                if (!alreadySynced) {
                    this.markDirty(targetNode.id)
                }
            },
        )

        this.connectionWatchers.set(conn.id, stop)

        sourceNode.onPortConnected(sourcePort, targetNode, targetPort)
        targetNode.onPortConnected(targetPort, sourceNode, sourcePort)
    }

    /**
     * Remove a connection, stop its reactive value watcher, and call `onPortDisconnected()`
     * on both the source and target node.
     */
    removeConnection(id: string) {
        const conn = this.connections.get(id)

        const stop = this.connectionWatchers.get(id)
        if (stop) {
            stop()
            this.connectionWatchers.delete(id)
        }
        this.connections.delete(id)

        const endpoints = conn ? this.resolveEndpoints(conn) : undefined
        if (!endpoints) return
        const { sourceNode, sourcePort, targetNode, targetPort } = endpoints

        sourceNode.onPortDisconnected(sourcePort, targetNode, targetPort)
        targetNode.onPortDisconnected(targetPort, sourceNode, sourcePort)
    }

    /** Find the node that owns the given port ID. */
    getNodeByPortId(portId: string): NodusBaseNode | undefined {
        return this.portToNode.get(portId)
    }

    /**
     * Recompute all nodes in topological (dependency) order.
     * Nodes involved in cycles are computed last.
     * Call this after programmatically changing port values to propagate updates through the graph.
     */
    evaluate() {
        const order = this.topologicalSort()
        this.computingNodes.clear()
        for (const nodeId of order) {
            const node = this.nodes.get(nodeId)
            if (!node) continue
            this.computeNode(node)
        }
    }

    /** Return the nodes directly connected downstream of the given output port (immediate neighbors only). */
    getConnectedNodes(port: NodusPort): NodusBaseNode[] {
        const nodes: NodusBaseNode[] = []
        for (const conn of this.connections.values()) {
            if (conn.sourcePortId !== port.id) continue
            const node = this.portToNode.get(conn.targetPortId)
            if (node) nodes.push(node)
        }
        return nodes
    }

    /** Return the node(s) directly connected upstream of the given input port (immediate neighbors only). */
    getSourceNodes(port: NodusPort): NodusBaseNode[] {
        const nodes: NodusBaseNode[] = []
        for (const conn of this.connections.values()) {
            if (conn.targetPortId !== port.id) continue
            const node = this.portToNode.get(conn.sourcePortId)
            if (node) nodes.push(node)
        }
        return nodes
    }

    /** Sync a node's inputs and call `compute()`, guarded against re-entrancy. */
    private computeNode(node: NodusBaseNode) {
        this.syncInputs(node)
        if (this.computingNodes.has(node.id)) return
        this.computingNodes.add(node.id)
        try {
            node.compute()
        } finally {
            this.computingNodes.delete(node.id)
        }
    }

    /**
     * Mark a node and its entire downstream reachability closure as dirty, then schedule a
     * batched flush. Marking the whole closure (not just the immediate target) guarantees that
     * when the flush reaches a node whose inputs converge from paths of different length off a
     * shared changing ancestor, every ancestor in the closure has already been computed earlier
     * in the same flush — so it never sees a mix of stale and fresh sibling inputs.
     */
    private markDirty(startNodeId: string) {
        const stack = [startNodeId]
        while (stack.length > 0) {
            const id = stack.pop()!
            if (this.dirtyNodes.has(id)) continue
            this.dirtyNodes.add(id)
            const node = this.nodes.get(id)
            if (!node) continue
            for (const output of node.outputs) {
                for (const conn of this.connections.values()) {
                    if (conn.sourcePortId !== output.id) continue
                    const downstream = this.portToNode.get(conn.targetPortId)
                    if (downstream) stack.push(downstream.id)
                }
            }
        }
        this.scheduleFlush()
    }

    private scheduleFlush() {
        if (this.flushScheduled) return
        this.flushScheduled = true
        void nextTick(() => this.flushDirty())
    }

    /** Compute every dirty node once, in topological order. */
    private flushDirty() {
        this.flushScheduled = false
        if (this.dirtyNodes.size === 0) return

        const dirty = this.dirtyNodes
        this.dirtyNodes = new Set()

        const order = this.topologicalSort()
        for (const nodeId of order) {
            if (!dirty.has(nodeId)) continue
            const node = this.nodes.get(nodeId)
            if (!node) continue
            this.computeNode(node)
        }
    }

    /**
     * Handle a port click for interactive connection creation.
     * - First click selects the port.
     * - Second click on a compatible port creates the connection.
     * - Second click on the same port or an incompatible port cancels the selection.
     *
     * Logs a `console.warn` if the connection attempt fails due to a type or direction mismatch,
     * making it easy to diagnose why a connection did not form.
     */
    selectPort(port: NodusPort, event?: PointerEvent) {
        if (!this.selectedPort.value) {
            this.setSelectedPort(port, event?.pointerType === 'touch')
            return
        }

        if (this.selectedPort.value.id === port.id) {
            this.setSelectedPort(null)
            return
        }

        if (this.selectedPort.value.ioType === port.ioType) {
            const direction = port.ioType === NodusPortType.Input ? 'inputs' : 'outputs'
            console.warn(
                `[vue-nodus] Cannot connect: both ports are ${direction}. One must be an input and one an output.`,
            )
            this.setSelectedPort(null)
            return
        }

        if (this.selectedPort.value.type !== port.type) {
            console.warn(
                `[vue-nodus] Cannot connect: port type "${this.selectedPort.value.type}" is incompatible with "${port.type}".`,
            )
            this.setSelectedPort(null)
            return
        }

        const existing = [...this.connections.values()].find(
            (con) =>
                (con.sourcePortId === port.id &&
                    con.targetPortId === this.selectedPort.value?.id) ||
                (con.targetPortId === port.id && con.sourcePortId === this.selectedPort.value?.id),
        )

        if (existing) {
            this.setSelectedPort(null)
            return
        }

        let source = this.selectedPort.value
        let target = port

        if (port.ioType === NodusPortType.Output) {
            source = port
            target = this.selectedPort.value
        }

        if (this.validateInputPortConnection(target)) {
            const connectionType = this.resolveConnectionType(source, target)
            const sourceNode = this.portToNode.get(source.id)
            const targetNode = this.portToNode.get(target.id)
            const label =
                sourceNode && targetNode
                    ? `Connected "${nodeDisplayName(sourceNode)}" and "${nodeDisplayName(targetNode)}"`
                    : 'Connection created'
            this.history?.snapshot(label)
            this.addConnection(new NodusConnection(source, target, target.color, connectionType))
        }

        this.setSelectedPort(null)
    }

    clearPortSelection() {
        this.setSelectedPort(null)
    }

    bringToFront(node: NodusBaseNode) {
        node.setZIndex(this.nextZIndex++)
    }

    private setSelectedPort(port: NodusPort | null, isTouch = false) {
        this.selectedPort.value = port
        this.selectedPortIsTouch.value = isTouch
    }

    private findPort(portId: string): NodusPort | undefined {
        const node = this.portToNode.get(portId)
        if (!node) return undefined
        return [...node.inputs, ...node.outputs].find((p) => p.id === portId)
    }

    /**
     * Resolve the source/target nodes and ports for a connection.
     * Returns `undefined` if any endpoint can no longer be found (e.g. torn down already).
     */
    private resolveEndpoints(conn: NodusConnection):
        | { sourceNode: NodusBaseNode; sourcePort: NodusPort; targetNode: NodusBaseNode; targetPort: NodusPort }
        | undefined {
        const sourcePort = this.findPort(conn.sourcePortId)
        const targetPort = this.findPort(conn.targetPortId)
        const sourceNode = this.portToNode.get(conn.sourcePortId)
        const targetNode = this.portToNode.get(conn.targetPortId)
        if (!sourcePort || !targetPort || !sourceNode || !targetNode) return undefined
        return { sourceNode, sourcePort, targetNode, targetPort }
    }

    private syncInputs(node: NodusBaseNode) {
        for (const inputPort of node.inputs) {
            const conn = [...this.connections.values()].find((c) => c.targetPortId === inputPort.id)
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

        // Nodes in cycles run last
        if (result.length < this.nodes.size) {
            for (const id of this.nodes.keys()) {
                if (!result.includes(id)) result.push(id)
            }
        }

        return result
    }

    private resolveConnectionType(source: NodusPort, target: NodusPort): string {
        const resolved = this.connectionTypeResolver?.(source, target)
        if (resolved === undefined) return 'bezier'
        return this.connectionTypeRegistry.resolveKeyForClassOrName(resolved)
    }

    private validateInputPortConnection(port: NodusPort) {
        if (port.isMultiport === false) {
            const value = [...this.connections.values()].find((con) => con.targetPortId === port.id)
            if (value) {
                console.warn(
                    `[vue-nodus] Cannot connect: port "${port.id}" already has a connection. Set isMultiport: true on the port to allow multiple inputs.`,
                )
                return false
            }
        }

        return true
    }
}
