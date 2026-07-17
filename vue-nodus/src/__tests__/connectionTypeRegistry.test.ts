import { describe, it, expect, vi, beforeEach } from 'vitest'
import NodusConnectionTypeRegistry from '../models/connectionTypes/ConnectionTypeRegistry'
import NodusConnectionType from '../models/connectionTypes/ConnectionType'
import NodusStraightConnectionType from '../models/connectionTypes/StraightConnectionType'

class CustomType extends NodusConnectionType {
    buildPath(x1: number, y1: number, x2: number, y2: number): string {
        return `M ${x1} ${y1} L ${x2} ${y2}`
    }
    getMidpoint(x1: number, y1: number, x2: number, y2: number) {
        return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 }
    }
}

describe('NodusConnectionTypeRegistry', () => {
    let registry: NodusConnectionTypeRegistry

    beforeEach(() => {
        registry = new NodusConnectionTypeRegistry()
    })

    it('seeds all 8 default named types', () => {
        const names = [
            'bezier',
            'bezier-dashed',
            'step',
            'step-dashed',
            'smoothstep',
            'smoothstep-dashed',
            'straight',
            'straight-dashed',
        ]
        for (const name of names) {
            expect(registry.get(name)).toBeInstanceOf(NodusConnectionType)
        }
    })

    it('marks dashed defaults with a dashArray and solid defaults without one', () => {
        expect(registry.get('bezier')!.dashArray).toBeUndefined()
        expect(registry.get('bezier-dashed')!.dashArray).toBe('8 6')
    })

    it('registers a custom named type and returns it via get()', () => {
        const custom = new NodusStraightConnectionType({ dashed: true })
        registry.register('my-straight', custom)
        expect(registry.get('my-straight')).toBe(custom)
    })

    it('warns and does not overwrite when registering an already-taken name', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const original = registry.get('bezier')
        registry.register('bezier', new NodusStraightConnectionType())

        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('bezier'))
        expect(registry.get('bezier')).toBe(original)

        warnSpy.mockRestore()
    })

    describe('resolveKeyForClassOrName', () => {
        it('returns a string value unchanged', () => {
            expect(registry.resolveKeyForClassOrName('step')).toBe('step')
        })

        it('auto-registers an unregistered class under its constructor name', () => {
            const key = registry.resolveKeyForClassOrName(CustomType)
            expect(key).toBe('CustomType')
            expect(registry.get('CustomType')).toBeInstanceOf(CustomType)
        })

        it('reuses the same key for the same class on repeat calls (no double-registration)', () => {
            const first = registry.resolveKeyForClassOrName(CustomType)
            const second = registry.resolveKeyForClassOrName(CustomType)
            expect(second).toBe(first)
            expect(registry.get(first)).toBe(registry.get(second))
        })

        it('de-duplicates with a numeric suffix when a different class collides on name', () => {
            class DuplicateNamed extends NodusConnectionType {
                buildPath(x1: number, y1: number, x2: number, y2: number): string {
                    return `M ${x1} ${y1} L ${x2} ${y2}`
                }
                getMidpoint(x1: number, y1: number, x2: number, y2: number) {
                    return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 }
                }
            }
            Object.defineProperty(DuplicateNamed, 'name', { value: 'CustomType' })

            const firstKey = registry.resolveKeyForClassOrName(CustomType)
            const secondKey = registry.resolveKeyForClassOrName(DuplicateNamed)

            expect(firstKey).toBe('CustomType')
            expect(secondKey).toBe('CustomType-2')
            expect(registry.get(secondKey)).toBeInstanceOf(DuplicateNamed)
        })
    })
})
