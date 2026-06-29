import { ref, type Ref } from 'vue'

export enum PortType {
    Input,
    Output,
}

export default class Port {
    id = crypto.randomUUID()
    type: string
    color = "white"
    ioType: PortType = PortType.Input
    isMultiport: boolean = false

    private _value: Ref<unknown>

    constructor(type: string, color: string = 'white', isMultiport: boolean = false, defaultValue: unknown = undefined) {
        this.type = type
        this.color = color
        this.isMultiport = isMultiport
        this._value = ref(defaultValue)
    }

    get value(): unknown {
        return this._value.value
    }

    set value(v: unknown) {
        this._value.value = v
    }

    get valueRef(): Ref<unknown> {
        return this._value
    }
}