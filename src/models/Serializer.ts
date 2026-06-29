import Graph from "./Graph";
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