import { reactive } from 'vue';
import NodusPort, { NodusPortType } from './Port'

/** Reactive position, size, and display state managed internally by the framework. */
export interface NodusInternalState {
    x: number
    y: number
    zIndex: number
    width: number | null
    height: number | null
    title: string
}

/** Optional settings for a node's appearance and layout behavior. */
export interface NodusSettingObject {
    /**
     * When `true` (default), VGraph wraps this node in `VBaseNode` (title bar + content area).
     * Set to `false` to supply a fully custom component that owns its own layout and port rendering.
     */
    isThinComponent: boolean
    /** Text shown in the node's title bar. */
    title: string
    /**
     * When `true` (default), `VBaseNode` automatically distributes ports along the node's left
     * and right edges. Set to `false` and use `VNodeRow` to position ports manually alongside
     * labeled content rows.
     */
    isPortAutoLayoutEnabled: boolean
    /** Fixed node width in pixels. `null` (default) means auto-size. */
    width: number | null
    /** Fixed node height in pixels. `null` (default) means auto-size. */
    height: number | null
}

/**
 * Base class for all custom node types. Extend this to define your own nodes.
 *
 * @example
 * class AddNode extends NodusBaseNode {
 *   constructor() {
 *     super('add-node', [new NodusPort('number'), new NodusPort('number')], [new NodusPort('number')], { title: 'Add' })
 *   }
 *   compute() {
 *     this.outputs[0].value = Number(this.inputs[0].value) + Number(this.inputs[1].value)
 *   }
 * }
 */
export default class NodusBaseNode {
    id = crypto.randomUUID()
    isThinComponent: boolean = true
    isPortAutoLayoutEnabled: boolean = true
    componentId: string

    inputs: Array<NodusPort> = []
    outputs: Array<NodusPort> = []

    internalState: NodusInternalState = reactive({
        x: 0,
        y: 0,
        zIndex: 0,
        width: null,
        height: null,
        title: '',
    })

    /**
     * @param componentId - Identifies the Vue component that renders this node.
     *                      Must exactly match the `id` passed to `board.registerComponent()`.
     * @param inputs      - Input ports. Their `ioType` is set to `NodusPortType.Input` automatically.
     * @param outputs     - Output ports. Their `ioType` is set to `NodusPortType.Output` automatically.
     * @param settings    - Optional appearance and layout overrides.
     */
    constructor(componentId: string, inputs: Array<NodusPort>, outputs: Array<NodusPort>, settings: Partial<NodusSettingObject> = {}) {
        this.isThinComponent = settings?.isThinComponent ?? this.isThinComponent;
        this.isPortAutoLayoutEnabled = settings?.isPortAutoLayoutEnabled ?? this.isPortAutoLayoutEnabled;
        this.internalState.title = settings?.title ?? this.internalState.title;
        this.internalState.width = settings?.width ?? this.internalState.width;
        this.internalState.height = settings?.height ?? this.internalState.height;
        this.componentId = componentId;
        this.inputs = inputs
        this.outputs = outputs

        for (const input of this.inputs) {
            input.ioType = NodusPortType.Input;
        }

        for (const output of this.outputs) {
            output.ioType = NodusPortType.Output;
        }
    }

    setZIndex(zIndex: number) {
        this.internalState.zIndex = zIndex
    }

    setPosition(x: number, y: number) {
        this.internalState.x = x
        this.internalState.y = y
    }

    /**
     * Override to recompute output values from input values.
     * Called automatically whenever a connected input port's value changes, and by
     * `graph.evaluate()` in topological order. Synchronous only — async operations are not supported.
     */
    compute(): void {}

    /**
     * Override to return custom node data to persist. Called by `NodusSerializer.serialize()`.
     * The returned object is merged with internal state (position, size, ports).
     * @returns A JSON-serializable object with custom properties to save.
     */
    serialize() {
        return {}
    }

    serializeInternal() {
        return {
            ...this.serialize(),
            ...this.internalState,
            id: this.id,
            componentId: this.componentId,
            ports: this.serializePorts()
        }
    }

    /**
     * Override to restore custom properties saved by `serialize()`.
     * Called by `NodusSerializer.deserialize()` before internal state (position, size, ports) is restored.
     * @param data - The full serialized node object, which includes internal state fields alongside your custom ones.
     */
    deserialize(data: Object) {}

    deserializeInternal(data: Object) {
        this.deserialize(data)

        const typedData = data as any
        if (typedData.id) this.id = typedData.id

        this.internalState.x = typedData.x ?? this.internalState.x
        this.internalState.y = typedData.y ?? this.internalState.y
        this.internalState.zIndex = typedData.zIndex ?? this.internalState.zIndex
        this.internalState.width = typedData.width ?? this.internalState.width
        this.internalState.height = typedData.height ?? this.internalState.height
        this.internalState.title = typedData.title ?? this.internalState.title

        const portData = typedData.ports
        if (portData) {
            const savedInputs = Object.values(portData).filter((p: any) => p.ioType === NodusPortType.Input)
            const savedOutputs = Object.values(portData).filter((p: any) => p.ioType === NodusPortType.Output)

            this.inputs.forEach((port, i) => {
                const saved = savedInputs[i] as any
                if (!saved) return
                port.id = saved.id
                if (saved.value !== undefined) port.value = saved.value
            })
            this.outputs.forEach((port, i) => {
                const saved = savedOutputs[i] as any
                if (!saved) return
                port.id = saved.id
                if (saved.value !== undefined) port.value = saved.value
            })
        }
    }

    private serializePorts() {
        const data: Record<string, any> = {}
        for (const port of this.inputs) {
            data[port.id] = {
                id: port.id,
                type: port.type,
                ioType: port.ioType,
                color: port.color,
                value: port.value,
            }
        }
        for (const port of this.outputs) {
            data[port.id] = {
                id: port.id,
                type: port.type,
                ioType: port.ioType,
                color: port.color,
                value: port.value,
            }
        }

        return data
    }
}
