import { markRaw, reactive, type ConcreteComponent } from 'vue';
import Port, { PortType } from './Port'

interface InternalState {
    x: number
    y: number
    zIndex: number
    width: number | null
    height: number | null
    title: string,
}

interface SettingObject {
    isThinComponent: boolean,
    title: string,
    isPortAutoLayoutEnabled: boolean,
    width: number | null,
    height: number | null,
}

export default class BaseNode {
    id = crypto.randomUUID()
    isThinComponent: boolean = true
    isPortAutoLayoutEnabled: boolean = true
    componentId: string

    inputs: Array<Port> = []
    outputs: Array<Port> = []

    internalState: InternalState = reactive({
        x: 0,
        y: 0,
        zIndex: 0,
        width: null,
        height: null,
        title: '',
    })

    constructor(componentId: string, inputs: Array<Port>, outputs: Array<Port>, settings: Partial<SettingObject> = {}) {
        this.isThinComponent = settings?.isThinComponent ?? this.isThinComponent;
        this.isPortAutoLayoutEnabled = settings?.isPortAutoLayoutEnabled ?? this.isPortAutoLayoutEnabled;
        this.internalState.title = settings?.title ?? this.internalState.title;
        this.internalState.width = settings?.width ?? this.internalState.width;
        this.internalState.height = settings?.height ?? this.internalState.height;
        this.componentId = componentId;
        this.inputs = inputs
        this.outputs = outputs

        for (const input of this.inputs) {
            input.ioType = PortType.Input;
        }

        for (const output of this.outputs) {
            output.ioType = PortType.Output;
        }
    }

    setZIndex(zIndex: number) {
        this.internalState.zIndex = zIndex
    }

    setPosition(x: number, y: number) {
        this.internalState.x = x
        this.internalState.y = y
    }

    compute(): void {}

    serialize() {
        return {}
    }

    serializeInternal() {
        return {
            ...this.serialize(),
            ...this.internalState,
            ports: this.serializePorts()
        }
    }

    deserialize(data: Object) {}

    deserializeInternal(data: Object) {
        this.deserialize(data)

        const typedData = data as Partial<InternalState>
        this.internalState.x = typedData.x ?? this.internalState.x;
        this.internalState.y = typedData.y ?? this.internalState.y;
        this.internalState.zIndex = typedData.zIndex ?? this.internalState.zIndex;
        this.internalState.width = typedData.width ?? this.internalState.width;
        this.internalState.height = typedData.height ?? this.internalState.height;
        this.internalState.title = typedData.title ?? this.internalState.title;

        const portData = (data as any).ports
        if (portData) {
            for (const port of [...this.inputs, ...this.outputs]) {
                const saved = portData[port.id]
                if (saved && saved.value !== undefined) {
                    port.value = saved.value
                }
            }
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