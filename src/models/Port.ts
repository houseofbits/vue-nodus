import { ref, toRaw, type Ref } from 'vue'

export enum PortType {
    Input,
    Output,
}

/**
 * Represents a data port on a node — either an input or an output.
 * Ports of the same `type` string can be connected. Port values are Vue Refs,
 * so you can use them in `computed` or `watch` expressions.
 *
 * @example
 * const input = new Port('number', '#4fc3f7')
 * const multiInput = new Port('number', '#4fc3f7', true)
 * const withDefault = new Port('number', '#4fc3f7', false, 0)
 */
export default class Port {
    id = crypto.randomUUID()
    /** Type tag used to validate connections. Only ports with the same `type` can be connected. */
    type: string
    /** CSS color for the port circle and its connections. Defaults to `'white'`. */
    color = "white"
    /** Set automatically by `BaseNode` — `PortType.Input` or `PortType.Output`. */
    ioType: PortType = PortType.Input
    /**
     * When `true`, this input port accepts multiple incoming connections.
     * When `false` (default), only one connection is allowed and further attempts are blocked.
     */
    isMultiport: boolean = false

    private _value: Ref<unknown>

    /**
     * @param type         - Type tag for connection matching (e.g. `'number'`, `'string'`, `'color'`).
     * @param color        - CSS color for the port. Defaults to `'white'`.
     * @param isMultiport  - Allow multiple incoming connections. Defaults to `false`.
     * @param defaultValue - Initial value of the port. Defaults to `undefined`.
     */
    constructor(type: string, color: string = 'white', isMultiport: boolean = false, defaultValue: unknown = undefined) {
        this.type = type
        this.color = color
        this.isMultiport = isMultiport
        this._value = ref(defaultValue)
    }

    /** Current port value. Setting this updates connected downstream ports via their watchers. */
    get value(): unknown {
        return toRaw(this)._value.value
    }

    set value(v: unknown) {
        toRaw(this)._value.value = v
    }

    /**
     * The underlying Vue `Ref` for this port's value.
     * Use in `computed` or `watch` to react to value changes:
     * @example
     * watch(port.valueRef, (newVal) => console.log(newVal))
     */
    get valueRef(): Ref<unknown> {
        return toRaw(this)._value
    }
}
