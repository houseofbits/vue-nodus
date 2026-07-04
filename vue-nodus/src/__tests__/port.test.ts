import { describe, it, expect } from 'vitest'
import NodusPort, { NodusPortType } from '../models/Port'
import NodusBaseNode from '../models/BaseNode'

describe('Port', () => {
    it('defaults color to white', () => {
        expect(new NodusPort('number').color).toBe('white')
    })

    it('defaults isMultiport to false', () => {
        expect(new NodusPort('number').isMultiport).toBe(false)
    })

    it('defaults value to undefined', () => {
        expect(new NodusPort('number').value).toBeUndefined()
    })

    it('accepts a defaultValue', () => {
        expect(new NodusPort('number', 'white', false, 42).value).toBe(42)
    })

    it('value setter updates valueRef', () => {
        const port = new NodusPort('number', 'white', false, 0)
        port.value = 99
        expect(port.valueRef.value).toBe(99)
    })

    it('valueRef and value stay in sync', () => {
        const port = new NodusPort('number')
        port.value = 'hello'
        expect(port.valueRef.value).toBe('hello')
        port.valueRef.value = 'world'
        expect(port.value).toBe('world')
    })
})

describe('BaseNode port assignment', () => {
    it('sets ioType.Input on all inputs', () => {
        const node = new NodusBaseNode('test', [new NodusPort('number'), new NodusPort('string')], [])
        for (const port of node.inputs) {
            expect(port.ioType).toBe(NodusPortType.Input)
        }
    })

    it('sets ioType.Output on all outputs', () => {
        const node = new NodusBaseNode('test', [], [new NodusPort('number'), new NodusPort('color')])
        for (const port of node.outputs) {
            expect(port.ioType).toBe(NodusPortType.Output)
        }
    })

    it('applies settings', () => {
        const node = new NodusBaseNode('test', [], [], {
            title: 'My Node',
            width: 250,
            isPortAutoLayoutEnabled: false,
        })
        expect(node.internalState.title).toBe('My Node')
        expect(node.internalState.width).toBe(250)
        expect(node.isPortAutoLayoutEnabled).toBe(false)
    })

    it('setPosition updates internalState', () => {
        const node = new NodusBaseNode('test', [], [])
        node.setPosition(100, 200)
        expect(node.internalState.x).toBe(100)
        expect(node.internalState.y).toBe(200)
    })
})
