import { NodusBaseNode, NodusPort } from '@houseofbits/vue-nodus'
import { reactive } from 'vue'
import AudioBaseNode, { AUDIO_PORT_TYPE, CLOCK_COLOR, CLOCK_PORT_TYPE, PARAM_COLOR } from './AudioBaseNode'
import ClockSourceNode from './ClockSourceNode'
import { audioEngine } from '../audio/AudioEngine'

interface InternalState {
    waveform: OscillatorType
    rate: number
    depth: number
}

/**
 * Low-frequency oscillator for modulating AudioParams: a slow OscillatorNode
 * scaled by a depth GainNode, so the output swings ±depth around the target
 * param's own value.
 */
export default class LfoSourceNode extends AudioBaseNode {
    private osc: OscillatorNode
    private depthGain: GainNode
    private unsubscribeClock: (() => void) | null = null

    state: InternalState = reactive({
        waveform: 'sine',
        rate: 2,
        depth: 100,
    })

    constructor() {
        super(
            'Lfo',
            [new NodusPort(CLOCK_PORT_TYPE, CLOCK_COLOR)],
            [new NodusPort(AUDIO_PORT_TYPE, PARAM_COLOR)],
            {
                title: 'LFO',
                isPortAutoLayoutEnabled: false,
                width: 240,
            },
        )

        this.osc = audioEngine.context.createOscillator()
        this.depthGain = audioEngine.context.createGain()
        this.osc.connect(this.depthGain)
        this.osc.start()
        this.applyParams()
    }

    applyParams(): void {
        const t = audioEngine.context.currentTime
        this.osc.type = this.state.waveform
        this.osc.frequency.setTargetAtTime(this.state.rate, t, 0.01)
        this.depthGain.gain.setTargetAtTime(this.state.depth, t, 0.01)
    }

    getAudioOutput(_port: NodusPort): AudioNode {
        return this.depthGain
    }

    getAudioInputTarget(_port: NodusPort): null {
        return null
    }

    onPortConnected(port: NodusPort, otherNode: NodusBaseNode, otherPort: NodusPort): void {
        super.onPortConnected(port, otherNode, otherPort)
        if (port !== this.inputs[0] || !(otherNode instanceof ClockSourceNode)) return
        this.unsubscribeClock = otherNode.subscribeTick((t) => this.retrigger(t))
    }

    onPortDisconnected(port: NodusPort, otherNode: NodusBaseNode, otherPort: NodusPort): void {
        super.onPortDisconnected(port, otherNode, otherPort)
        if (port !== this.inputs[0]) return
        this.unsubscribeClock?.()
        this.unsubscribeClock = null
    }

    /**
     * Hard-syncs phase to a clock tick. Without an AudioWorklet, resetting an
     * OscillatorNode's phase means swapping in a fresh one timed to start
     * exactly as the old one stops — the `onended` handoff avoids a gap or
     * double-voice glitch around the switch.
     */
    private retrigger(time: number): void {
        const ctx = audioEngine.context
        const nextOsc = ctx.createOscillator()
        nextOsc.type = this.state.waveform
        nextOsc.frequency.setValueAtTime(this.state.rate, time)
        nextOsc.connect(this.depthGain)
        nextOsc.start(time)

        const prevOsc = this.osc
        prevOsc.stop(time)
        prevOsc.onended = () => prevOsc.disconnect()

        this.osc = nextOsc
    }

    dispose(): void {
        this.unsubscribeClock?.()
        try {
            this.osc.stop()
        } catch {
            // Already stopped.
        }
        this.osc.disconnect()
        this.depthGain.disconnect()
    }

    serialize() {
        return { ...this.state }
    }

    deserialize(data: any) {
        if (data.waveform !== undefined) this.state.waveform = data.waveform
        if (data.rate !== undefined) this.state.rate = data.rate
        if (data.depth !== undefined) this.state.depth = data.depth
        this.applyParams()
    }
}
