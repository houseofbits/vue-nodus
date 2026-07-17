import { NodusPort } from '@houseofbits/vue-nodus'
import { reactive } from 'vue'
import AudioBaseNode, { AUDIO_PORT_TYPE, PARAM_COLOR, SIGNAL_COLOR } from './AudioBaseNode'
import { audioEngine } from '../audio/AudioEngine'

interface InternalState {
    type: BiquadFilterType
    frequency: number
    q: number
}

export default class BiquadFilterControlNode extends AudioBaseNode {
    private filter: BiquadFilterNode

    state: InternalState = reactive({
        type: 'lowpass',
        frequency: 800,
        q: 1,
    })

    constructor() {
        super(
            'Filter',
            [
                new NodusPort(AUDIO_PORT_TYPE, SIGNAL_COLOR, true),
                new NodusPort(AUDIO_PORT_TYPE, PARAM_COLOR, true),
            ],
            [new NodusPort(AUDIO_PORT_TYPE, SIGNAL_COLOR)],
            {
                title: 'Filter',
                isPortAutoLayoutEnabled: false,
                width: 240,
            },
        )

        this.filter = audioEngine.context.createBiquadFilter()
        this.applyParams()
    }

    applyParams(): void {
        const t = audioEngine.context.currentTime
        this.filter.type = this.state.type
        this.filter.frequency.setTargetAtTime(this.state.frequency, t, 0.01)
        this.filter.Q.setTargetAtTime(this.state.q, t, 0.01)
    }

    getAudioOutput(_port: NodusPort): AudioNode {
        return this.filter
    }

    getAudioInputTarget(port: NodusPort): AudioNode | AudioParam {
        return port === this.inputs[0] ? this.filter : this.filter.frequency
    }

    dispose(): void {
        this.filter.disconnect()
    }

    serialize() {
        return { ...this.state }
    }

    deserialize(data: any) {
        if (data.type !== undefined) this.state.type = data.type
        if (data.frequency !== undefined) this.state.frequency = data.frequency
        if (data.q !== undefined) this.state.q = data.q
        this.applyParams()
    }
}
