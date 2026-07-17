import { NodusPort } from '@houseofbits/vue-nodus'
import { reactive } from 'vue'
import AudioBaseNode, { AUDIO_PORT_TYPE, PARAM_COLOR, SIGNAL_COLOR } from './AudioBaseNode'
import { audioEngine } from '../audio/AudioEngine'

interface InternalState {
    gain: number
}

export default class GainControlNode extends AudioBaseNode {
    private gain: GainNode

    state: InternalState = reactive({
        gain: 0.5,
    })

    constructor() {
        super(
            'Gain',
            [
                new NodusPort(AUDIO_PORT_TYPE, SIGNAL_COLOR, true),
                new NodusPort(AUDIO_PORT_TYPE, PARAM_COLOR, true),
            ],
            [new NodusPort(AUDIO_PORT_TYPE, SIGNAL_COLOR)],
            {
                title: 'Gain',
                isPortAutoLayoutEnabled: false,
                width: 240,
            },
        )

        this.gain = audioEngine.context.createGain()
        this.applyParams()
    }

    applyParams(): void {
        this.gain.gain.setTargetAtTime(this.state.gain, audioEngine.context.currentTime, 0.01)
    }

    getAudioOutput(_port: NodusPort): AudioNode {
        return this.gain
    }

    getAudioInputTarget(port: NodusPort): AudioNode | AudioParam {
        return port === this.inputs[0] ? this.gain : this.gain.gain
    }

    dispose(): void {
        this.gain.disconnect()
    }

    serialize() {
        return { ...this.state }
    }

    deserialize(data: any) {
        if (data.gain !== undefined) this.state.gain = data.gain
        this.applyParams()
    }
}
