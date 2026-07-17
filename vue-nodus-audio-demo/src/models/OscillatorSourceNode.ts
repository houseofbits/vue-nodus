import { NodusPort } from '@houseofbits/vue-nodus'
import { reactive } from 'vue'
import AudioBaseNode, { AUDIO_PORT_TYPE, PARAM_COLOR, SIGNAL_COLOR } from './AudioBaseNode'
import { audioEngine } from '../audio/AudioEngine'

interface InternalState {
    waveform: OscillatorType
    frequency: number
    detune: number
}

export default class OscillatorSourceNode extends AudioBaseNode {
    private osc: OscillatorNode

    state: InternalState = reactive({
        waveform: 'sawtooth',
        frequency: 220,
        detune: 0,
    })

    constructor() {
        super(
            'Oscillator',
            [new NodusPort(AUDIO_PORT_TYPE, PARAM_COLOR, true)],
            [new NodusPort(AUDIO_PORT_TYPE, SIGNAL_COLOR)],
            {
                title: 'Oscillator',
                isPortAutoLayoutEnabled: false,
                width: 240,
            },
        )

        this.osc = audioEngine.context.createOscillator()
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
        return this.osc
    }

    getAudioInputTarget(_port: NodusPort): AudioParam {
        return this.osc.frequency
    }

    dispose(): void {
        try {
            this.osc.stop()
        } catch {
            // Already stopped.
        }
        this.osc.disconnect()
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
