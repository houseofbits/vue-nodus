import { describe, it, expect } from 'vitest'
import Port, { PortType } from '../models/Port'
import BaseNode from '../models/BaseNode'

describe('Port', () => {
    it('defaults color to white', () => {
        expect(new Port('number').color).toBe('white')
    })

    it('defaults isMultiport to false', () => {
        expect(new Port('number').isMultiport).toBe(false)
    })

    it('defaults value to undefined', () => {
        expect(new Port('number').value).toBeUndefined()
    })

    it('accepts a defaultValue', () => {
        expect(new Port('number', 'white', false, 42).value).toBe(42)
    })

    it('value setter updates valueRef', () => {
        const port = new Port('number', 'white', false, 0)
        port.value = 99
        expect(port.valueRef.value).toBe(99)
    })

    it('valueRef and value stay in sync', () => {
        const port = new Port('number')
        port.value = 'hello'
        expect(port.valueRef.value).toBe('hello')
        port.valueRef.value = 'world'
        expect(port.value).toBe('world')
    })
})

describe('BaseNode port assignment', () => {
    it('sets ioType.Input on all inputs', () => {
        const node = new BaseNode('test', [new Port('number'), new Port('string')], [])
        for (const port of node.inputs) {
            expect(port.ioType).toBe(PortType.Input)
        }
    })

    it('sets ioType.Output on all outputs', () => {
        const node = new BaseNode('test', [], [new Port('number'), new Port('color')])
        for (const port of node.outputs) {
            expect(port.ioType).toBe(PortType.Output)
        }
    })

    it('applies settings', () => {
        const node = new BaseNode('test', [], [], {
            title: 'My Node',
            width: 250,
            isPortAutoLayoutEnabled: false,
        })
        expect(node.internalState.title).toBe('My Node')
        expect(node.internalState.width).toBe(250)
        expect(node.isPortAutoLayoutEnabled).toBe(false)
    })

    it('setPosition updates internalState', () => {
        const node = new BaseNode('test', [], [])
        node.setPosition(100, 200)
        expect(node.internalState.x).toBe(100)
        expect(node.internalState.y).toBe(200)
    })
})
