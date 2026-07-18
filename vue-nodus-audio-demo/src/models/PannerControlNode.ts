import { NodusPort } from '@houseofbits/vue-nodus'
import { reactive } from 'vue'
import AudioBaseNode, { AUDIO_PORT_TYPE, PARAM_COLOR, SIGNAL_COLOR } from './AudioBaseNode'
import { audioEngine } from '../audio/AudioEngine'

interface InternalState {
    pan: number
}

export default class PannerControlNode extends AudioBaseNode {
    private panner: StereoPannerNode

    state: InternalState = reactive({
        pan: 0,
    })

    constructor() {
        super(
            'Panner',
            [
                new NodusPort(AUDIO_PORT_TYPE, SIGNAL_COLOR, true),
                new NodusPort(AUDIO_PORT_TYPE, PARAM_COLOR, true),
            ],
            [new NodusPort(AUDIO_PORT_TYPE, SIGNAL_COLOR)],
            {
                title: 'Panner',
                isPortAutoLayoutEnabled: false,
                width: 240,
            },
        )

        this.panner = audioEngine.context.createStereoPanner()
        this.applyParams()
    }

    applyParams(): void {
        this.panner.pan.setTargetAtTime(this.state.pan, audioEngine.context.currentTime, 0.01)
    }

    getAudioOutput(_port: NodusPort): AudioNode {
        return this.panner
    }

    getAudioInputTarget(port: NodusPort): AudioNode | AudioParam {
        return port === this.inputs[0] ? this.panner : this.panner.pan
    }

    dispose(): void {
        this.panner.disconnect()
    }

    serialize() {
        return { ...this.state }
    }

    deserialize(data: any) {
        if (data.pan !== undefined) this.state.pan = data.pan
        this.applyParams()
    }
}
