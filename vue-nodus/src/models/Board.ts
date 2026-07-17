import NodusGraph from './Graph'
import NodusSerializer from './Serializer'
import NodusHistory from './History'
import View from './View'
import type { Component } from 'vue'
import NodusConnectionTypeRegistry, {
    type ConnectionTypeResolver,
} from './connectionTypes/ConnectionTypeRegistry.js'
import type NodusConnectionType from './connectionTypes/ConnectionType.js'

/**
 * Top-level orchestrator for the node editor. Create one `NodusBoard` per editor instance
 * and pass it to `<VGraph :board="board" />`.
 *
 * @example
 * const board = new NodusBoard()
 * board.registerComponent('my-node', MyNodeComponent)
 * board.graph.addNode(new MyNode())
 */
export default class NodusBoard {
    connectionTypes: NodusConnectionTypeRegistry = new NodusConnectionTypeRegistry()
    graph: NodusGraph = new NodusGraph(this.connectionTypes)
    view: View = new View(this.graph, this.connectionTypes)
    registry = new Map<string, Component>()
    serializer: NodusSerializer = new NodusSerializer(this.graph, this.view.viewport)
    history: NodusHistory = new NodusHistory(this.serializer)

    constructor() {
        this.graph.history = this.history
        this.view.history = this.history
        this.history.setPortRegistry(this.view.portRegistry)
    }

    /**
     * Register a Vue component for a given node type.
     * The `id` must exactly match the `componentId` set in the corresponding `NodusBaseNode` constructor.
     * Call this before adding nodes of that type to the graph.
     * @param id        - The component identifier (must match `NodusBaseNode.componentId`).
     * @param component - The Vue component to render nodes of this type.
     */
    registerComponent(id: string, component: Component) {
        if (this.registry.has(id)) {
            console.warn(`Component already registered: ${id}`)

            return
        }

        this.registry.set(id, component)
    }

    /**
     * Look up a registered component by its ID.
     * @param id - The component identifier.
     * @returns The registered component, or `undefined` if not registered.
     */
    getComponent(id: string): Component | undefined {
        return this.registry.get(id)
    }

    /** Register a named connection type. Call `board.registerConnectionType('name', new MyType())`. */
    registerConnectionType(name: string, type: NodusConnectionType) {
        this.connectionTypes.register(name, type)
    }

    /** Look up a registered connection type by name. */
    getConnectionType(name: string): NodusConnectionType | undefined {
        return this.connectionTypes.get(name)
    }

    /** Register a function deciding which connection type applies to a newly connected port pair. */
    registerConnectionTypeResolver(resolver: ConnectionTypeResolver) {
        this.graph.registerConnectionTypeResolver(resolver)
    }
}
