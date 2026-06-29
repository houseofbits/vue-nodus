import Graph from "./Graph";
import View from "./View";
import type { DefineComponent } from 'vue';

export default class Board {
    graph: Graph = new Graph()
    view: View = new View(this.graph)
    registry = new Map<string, DefineComponent>();

    constructor() {

    }

    registerComponent(id: string, component: DefineComponent) {
        if (this.registry.has(id)) {
            console.warn(`Component already registered: ${id}`);

            return;
        }

        this.registry.set(id, component);
    }

    getComponent(id: string): DefineComponent | undefined {
        return this.registry.get(id);
    }

    serialize() {
        const nodes: Record<string, any> = {}
        for(const [key, node] of this.graph.nodes) {
            nodes[key] = node.serialize()
        }

        return {
            nodes,
            connections: {},
            board: {
                panX: this.view.viewport.state.panX,
                panY: this.view.viewport.state.panY,
                zoom: this.view.viewport.state.zoom,
            }
        }
    }
}