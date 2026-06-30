import Graph from "./Graph";
import Serializer from "./Serializer";
import View from "./View";
import type { DefineComponent } from 'vue';

/**
 * Top-level orchestrator for the node editor. Create one `Board` per editor instance
 * and pass it to `<VGraph :board="board" />`.
 *
 * @example
 * const board = new Board()
 * board.registerComponent('my-node', MyNodeComponent)
 * board.graph.addNode(new MyNode())
 */
export default class Board {
    graph: Graph = new Graph()
    view: View = new View(this.graph)
    registry = new Map<string, DefineComponent>()
    serializer: Serializer = new Serializer(this.graph, this.view.viewport)

    /**
     * Register a Vue component for a given node type.
     * The `id` must exactly match the `componentId` set in the corresponding `BaseNode` constructor.
     * Call this before adding nodes of that type to the graph.
     * @param id        - The component identifier (must match `BaseNode.componentId`).
     * @param component - The Vue component to render nodes of this type.
     */
    registerComponent(id: string, component: DefineComponent) {
        if (this.registry.has(id)) {
            console.warn(`Component already registered: ${id}`);

            return;
        }

        this.registry.set(id, component);
    }

    /**
     * Look up a registered component by its ID.
     * @param id - The component identifier.
     * @returns The registered component, or `undefined` if not registered.
     */
    getComponent(id: string): DefineComponent | undefined {
        return this.registry.get(id);
    }

}
