import Graph from "./Graph";
import Serializer from "./Serializer";
import View from "./View";
import type { DefineComponent } from 'vue';

export default class Board {
    graph: Graph = new Graph()
    view: View = new View(this.graph)
    registry = new Map<string, DefineComponent>()
    serializer: Serializer = new Serializer(this.graph, this.view.viewport)

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

}