import NodusConnection from "./Connection";
import NodusGraph from "./Graph";
import NodusPort from "./Port";
import NodusBaseNode from "./BaseNode";
import Viewport from "./Viewport";

/**
 * Saves and restores the full graph state (nodes, connections, and viewport position).
 * Access via `board.serializer`.
 */
export default class NodusSerializer {
    graph: NodusGraph
    viewport: Viewport

    constructor(graph: NodusGraph, viewport: Viewport) {
        this.graph = graph
        this.viewport = viewport
    }

    /**
     * Serialize the entire graph to a plain object suitable for `JSON.stringify`.
     * The result includes all node positions, port values, connections, and viewport state.
     *
     * @returns An object with `nodes`, `connections`, and `board` (pan/zoom) fields.
     *
     * @example
     * const saved = JSON.stringify(board.serializer.serialize())
     * localStorage.setItem('graph', saved)
     */
    serialize() {
        const nodes: Record<string, any> = {}
        for(const [key, node] of this.graph.nodes) {
            nodes[key] = node.serializeInternal()
        }

        return {
            nodes,
            connections: this.serializeConnections(),
            board: {
                panX: this.viewport.state.panX,
                panY: this.viewport.state.panY,
                zoom: this.viewport.state.zoom,
            }
        }
    }

    /**
     * Restore the graph from a previously serialized object. Clears the current graph first.
     *
     * The `factory` function is called once per saved node. It must return a new node instance
     * for every `componentId` present in the saved data — if a `componentId` is unhandled, the
     * factory should throw so the error surfaces early rather than silently producing a broken graph.
     *
     * @param data    - The object returned by a previous `serialize()` call.
     * @param factory - Creates a node instance given its `componentId` and raw saved data.
     *
     * @example
     * board.serializer.deserialize(saved, (componentId) => {
     *   switch (componentId) {
     *     case 'my-node': return new MyNode()
     *     default: throw new Error(`Unknown node type: ${componentId}`)
     *   }
     * })
     */
    deserialize(data: any, factory: (componentId: string, data: any) => NodusBaseNode): void {
        this.clearGraph()

        for (const nodeData of Object.values(data.nodes) as any[]) {
            const node = factory(nodeData.componentId, nodeData)
            node.deserializeInternal(nodeData)
            this.graph.addNode(node)
        }

        for (const connData of Object.values(data.connections) as any[]) {
            const conn = new NodusConnection(
                { id: connData.sourcePortId } as NodusPort,
                { id: connData.targetPortId } as NodusPort,
                connData.color,
            )
            conn.id = connData.id
            this.graph.addConnection(conn)
        }

        if (data.board) {
            this.viewport.state.panX = data.board.panX
            this.viewport.state.panY = data.board.panY
            this.viewport.state.zoom = data.board.zoom
        }
    }

    private clearGraph(): void {
        const nodeIds = [...this.graph.nodes.keys()]
        for (const id of nodeIds) {
            this.graph.removeNode(id)
        }
    }

    private serializeConnections() {
        const data: Record<string, any> = {}

        for(const [id, conn] of this.graph.connections) {
            data[id] = {
                id: conn.id,
                sourcePortId: conn.sourcePortId,
                targetPortId: conn.targetPortId,
                color: conn.color,
            }
        }

        return data
    }
}
