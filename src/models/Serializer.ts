import Connection from "./Connection";
import Graph from "./Graph";
import Port from "./Port";
import BaseNode from "./BaseNode";
import Viewport from "./Viewport";

export default class Serializer {
    graph: Graph
    viewport: Viewport

    constructor(graph: Graph, viewport: Viewport) {
        this.graph = graph
        this.viewport = viewport
    }

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

    deserialize(data: any, factory: (componentId: string, data: any) => BaseNode): void {
        this.clearGraph()

        for (const nodeData of Object.values(data.nodes) as any[]) {
            const node = factory(nodeData.componentId, nodeData)
            node.deserializeInternal(nodeData)
            this.graph.addNode(node)
        }

        for (const connData of Object.values(data.connections) as any[]) {
            const conn = new Connection(
                { id: connData.sourcePortId } as Port,
                { id: connData.targetPortId } as Port,
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