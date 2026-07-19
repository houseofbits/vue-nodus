import { NodusBaseNode, NodusPort } from '@houseofbits/vue-nodus'
import { reactive } from 'vue'
import AudioBaseNode, { AUDIO_PORT_TYPE, CLOCK_COLOR, CLOCK_PORT_TYPE, PARAM_COLOR, SIGNAL_COLOR } from './AudioBaseNode'
import ClockSourceNode from './ClockSourceNode'
import { audioEngine } from '../audio/AudioEngine'

interface InternalState {
    waveform: OscillatorType
    frequency: number
    detune: number
}

export default class OscillatorSourceNode extends AudioBaseNode {
    private osc: OscillatorNode
    // Stable node identity exposed via getAudioOutput: retrigger() swaps the
    // oscillator feeding this, so existing downstream connections (wired to
    // this gain's identity, not the oscillator's) survive a hard-sync.
    private outputGain: GainNode
    private unsubscribeClock: (() => void) | null = null

    state: InternalState = reactive({
        waveform: 'sawtooth',
        frequency: 220,
        detune: 0,
    })

    constructor() {
        super(
            'Oscillator',
            [new NodusPort(AUDIO_PORT_TYPE, PARAM_COLOR, true), new NodusPort(CLOCK_PORT_TYPE, CLOCK_COLOR)],
            [new NodusPort(AUDIO_PORT_TYPE, SIGNAL_COLOR)],
            {
                title: 'Oscillator',
                isPortAutoLayoutEnabled: false,
                width: 240,
            },
        )

        this.outputGain = audioEngine.context.createGain()
        this.osc = audioEngine.context.createOscillator()
        this.osc.connect(this.outputGain)
        // Started once for the node's whole lifetime (legal while the context
        // is suspended); audibility is governed by connections and the
        // context's running state.
        this.osc.start()
        this.applyParams()
    }

    applyParams(): void {
        const t = audioEngine.context.currentTime
        this.osc.type = this.state.waveform
        this.osc.frequency.setTargetAtTime(this.state.frequency, t, 0.01)
        this.osc.detune.setTargetAtTime(this.state.detune, t, 0.01)
    }

    getAudioOutput(_port: NodusPort): AudioNode {
        return this.outputGain
    }

    getAudioInputTarget(port: NodusPort): AudioParam | null {
        return port === this.inputs[0] ? this.osc.frequency : null
    }

    onPortConnected(port: NodusPort, otherNode: NodusBaseNode, otherPort: NodusPort): void {
        super.onPortConnected(port, otherNode, otherPort)
        if (port !== this.inputs[1] || !(otherNode instanceof ClockSourceNode)) return
        this.unsubscribeClock = otherNode.subscribeTick((t) => this.retrigger(t))
    }

    onPortDisconnected(port: NodusPort, otherNode: NodusBaseNode, otherPort: NodusPort): void {
        super.onPortDisconnected(port, otherNode, otherPort)
        if (port !== this.inputs[1]) return
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
        nextOsc.frequency.setValueAtTime(this.state.frequency, time)
        nextOsc.detune.setValueAtTime(this.state.detune, time)
        nextOsc.connect(this.outputGain)
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
        this.outputGain.disconnect()
    }

    serialize() {
        return { ...this.state }
    }

    deserialize(data: any) {
        if (data.waveform !== undefined) this.state.waveform = data.waveform
        if (data.frequency !== undefined) this.state.frequency = data.frequency
        if (data.detune !== undefined) this.state.detune = data.detune
        this.applyParams()
    }
}
