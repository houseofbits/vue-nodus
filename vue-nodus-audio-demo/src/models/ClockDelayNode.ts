import { NodusBaseNode, NodusPort } from '@houseofbits/vue-nodus'
import { reactive } from 'vue'
import ClockSourceNode from './ClockSourceNode'
import { CLOCK_COLOR, CLOCK_PORT_TYPE } from './AudioBaseNode'

interface InternalState {
    /** Delay applied to each incoming tick, in seconds. */
    delayTime: number
}

/**
 * Delays clock ticks from an upstream Clock (or another Clock Delay) by a
 * fixed time and re-emits them to its own subscribers — no scheduler of its
 * own is needed since Web Audio automation already accepts a future time.
 */
export default class ClockDelayNode extends ClockSourceNode {
    private unsubscribeUpstream: (() => void) | null = null

    state: InternalState = reactive({
        delayTime: 0.2,
    })

    constructor() {
        super(
            'ClockDelay',
            [new NodusPort(CLOCK_PORT_TYPE, CLOCK_COLOR)],
            [new NodusPort(CLOCK_PORT_TYPE, CLOCK_COLOR)],
            { title: 'Clock Delay', isPortAutoLayoutEnabled: false, width: 220 },
        )
    }

    onPortConnected(port: NodusPort, otherNode: NodusBaseNode, otherPort: NodusPort): void {
        super.onPortConnected(port, otherNode, otherPort)
        if (port !== this.inputs[0] || !(otherNode instanceof ClockSourceNode)) return
        this.unsubscribeUpstream = otherNode.subscribeTick((t) => this.emitTick(t + this.state.delayTime))
    }

    onPortDisconnected(port: NodusPort, otherNode: NodusBaseNode, otherPort: NodusPort): void {
        super.onPortDisconnected(port, otherNode, otherPort)
        if (port !== this.inputs[0]) return
        this.unsubscribeUpstream?.()
        this.unsubscribeUpstream = null
    }

    getAudioOutput(_port: NodusPort): null {
        return null
    }

    getAudioInputTarget(_port: NodusPort): null {
        return null
    }

    dispose(): void {
        this.unsubscribeUpstream?.()
    }

    serialize() {
        return { ...this.state }
    }

    deserialize(data: any) {
        if (data.delayTime !== undefined) this.state.delayTime = data.delayTime
    }
}
