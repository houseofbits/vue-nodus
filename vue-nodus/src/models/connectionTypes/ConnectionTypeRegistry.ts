import NodusConnectionType from './ConnectionType.js'
import NodusBezierConnectionType from './BezierConnectionType.js'
import NodusStepConnectionType from './StepConnectionType.js'
import NodusSmoothStepConnectionType from './SmoothStepConnectionType.js'
import NodusStraightConnectionType from './StraightConnectionType.js'
import type NodusPort from '../Port.js'

export type ConnectionTypeConstructor = new () => NodusConnectionType

/**
 * Called when a new connection is created interactively (via `NodusGraph.selectPort()`) to decide
 * which connection type applies to a given pair of ports. Return a registered name, an unregistered
 * class (auto-registered on first use), or `undefined` to fall back to the default (`'bezier'`).
 */
export type ConnectionTypeResolver = (
    source: NodusPort,
    target: NodusPort,
) => string | ConnectionTypeConstructor | undefined

/**
 * Per-`NodusBoard` registry of named connection types. Pre-seeded with 8 built-in entries
 * (`bezier`, `step`, `smoothstep`, `straight`, each with a `-dashed` variant).
 */
export default class NodusConnectionTypeRegistry {
    private types = new Map<string, NodusConnectionType>()
    private namesByConstructor = new Map<ConnectionTypeConstructor, string>()

    constructor() {
        this.register('bezier', new NodusBezierConnectionType())
        this.register('bezier-dashed', new NodusBezierConnectionType({ dashed: true }))
        this.register('step', new NodusStepConnectionType())
        this.register('step-dashed', new NodusStepConnectionType({ dashed: true }))
        this.register('smoothstep', new NodusSmoothStepConnectionType())
        this.register('smoothstep-dashed', new NodusSmoothStepConnectionType({ dashed: true }))
        this.register('straight', new NodusStraightConnectionType())
        this.register('straight-dashed', new NodusStraightConnectionType({ dashed: true }))
    }

    /** Register a named connection type. Warns and does nothing if the name is already taken. */
    register(name: string, type: NodusConnectionType) {
        if (this.types.has(name)) {
            console.warn(`[vue-nodus] Connection type already registered: ${name}`)
            return
        }

        this.types.set(name, type)
        this.namesByConstructor.set(type.constructor as ConnectionTypeConstructor, name)
    }

    /** Look up a registered connection type by name. */
    get(name: string): NodusConnectionType | undefined {
        return this.types.get(name)
    }

    /**
     * Resolve a `ConnectionTypeResolver`'s return value to a stable registry key.
     * - A string is returned as-is.
     * - A class constructor is auto-registered (instantiated with no args) under its `.name`,
     *   reused by identity on repeat calls, and de-duplicated with a numeric suffix if that
     *   name is already taken by a different constructor.
     */
    resolveKeyForClassOrName(value: string | ConnectionTypeConstructor): string {
        if (typeof value === 'string') {
            return value
        }

        const existing = this.namesByConstructor.get(value)
        if (existing) {
            return existing
        }

        const baseName = value.name || 'ConnectionType'
        let key = baseName
        let suffix = 2
        while (this.types.has(key)) {
            key = `${baseName}-${suffix++}`
        }

        this.register(key, new value())
        return key
    }
}
