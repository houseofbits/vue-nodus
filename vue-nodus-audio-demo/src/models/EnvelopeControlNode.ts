import { NodusBaseNode, NodusPort } from '@houseofbits/vue-nodus'
import { reactive } from 'vue'
import AudioBaseNode, { AUDIO_PORT_TYPE, CLOCK_COLOR, CLOCK_PORT_TYPE, PARAM_COLOR } from './AudioBaseNode'
import StepSequencerNode from './StepSequencerNode'
import ClockSourceNode from './ClockSourceNode'
import { audioEngine } from '../audio/AudioEngine'

interface InternalState {
    attack: number
    decay: number
    sustain: number
    release: number
    peak: number
}

/**
 * Self-timed ADSR envelope, output as a `ConstantSourceNode` for wiring into
 * any param-mod input (e.g. a Gain's `gain mod` with the Gain slider at 0).
 * Always driven by its `trig in` connection — a StepSequencerNode's `trig
 * out` (step 1 only) or a bare ClockSourceNode tick, either way just a single
 * onset time. Every trigger plays a complete attack → decay → release in one
 * shot: `sustain` is only the level the decay stage lands on right before
 * release begins, not a held plateau — there's no separate "note off".
 */
export default class EnvelopeControlNode extends AudioBaseNode {
    private envSource: ConstantSourceNode
    private unsubscribeSequencer: (() => void) | null = null
    private unsubscribeClock: (() => void) | null = null

    state: InternalState = reactive({
        attack: 0.05,
        decay: 0.2,
        sustain: 0.6,
        release: 0.3,
        peak: 1,
    })

    constructor() {
        super(
            'Envelope',
            [new NodusPort(CLOCK_PORT_TYPE, CLOCK_COLOR)],
            [new NodusPort(AUDIO_PORT_TYPE, PARAM_COLOR)],
            {
                title: 'Envelope',
                isPortAutoLayoutEnabled: false,
                width: 240,
            },
        )

        this.envSource = audioEngine.context.createConstantSource()
        this.envSource.offset.value = 0
        this.envSource.start()
    }

    trigger(time = audioEngine.context.currentTime): void {
        const offset = this.envSource.offset
        const decayStart = time + this.state.attack
        const releaseStart = decayStart + this.state.decay
        offset.setTargetAtTime(this.state.peak, time, Math.max(0.003, this.state.attack / 3))
        offset.setTargetAtTime(this.state.sustain * this.state.peak, decayStart, Math.max(0.003, this.state.decay / 3))
        offset.setTargetAtTime(0, releaseStart, Math.max(0.003, this.state.release / 3))
    }

    getAudioOutput(_port: NodusPort): AudioNode {
        return this.envSource
    }

    getAudioInputTarget(_port: NodusPort): null {
        return null
    }

    onPortConnected(port: NodusPort, otherNode: NodusBaseNode, otherPort: NodusPort): void {
        super.onPortConnected(port, otherNode, otherPort)
        if (port !== this.inputs[0]) return
        if (otherNode instanceof StepSequencerNode) {
            this.unsubscribeSequencer = otherNode.subscribeTrigger((t) => this.trigger(t))
        } else if (otherNode instanceof ClockSourceNode) {
            this.unsubscribeClock = otherNode.subscribeTick((t) => this.trigger(t))
        }
    }

    onPortDisconnected(port: NodusPort, otherNode: NodusBaseNode, otherPort: NodusPort): void {
        super.onPortDisconnected(port, otherNode, otherPort)
        if (port !== this.inputs[0]) return
        this.unsubscribeSequencer?.()
        this.unsubscribeSequencer = null
        this.unsubscribeClock?.()
        this.unsubscribeClock = null
    }

    dispose(): void {
        this.unsubscribeSequencer?.()
        this.unsubscribeClock?.()
        try {
            this.envSource.stop()
        } catch {
            // Already stopped.
        }
        this.envSource.disconnect()
    }

    serialize() {
        return { ...this.state }
    }

    deserialize(data: any) {
        if (data.attack !== undefined) this.state.attack = data.attack
        if (data.decay !== undefined) this.state.decay = data.decay
        if (data.sustain !== undefined) this.state.sustain = data.sustain
        if (data.release !== undefined) this.state.release = data.release
        if (data.peak !== undefined) this.state.peak = data.peak
    }
}
