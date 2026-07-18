import { NodusPort } from '@houseofbits/vue-nodus'
import { reactive } from 'vue'
import AudioBaseNode, { AUDIO_PORT_TYPE, SIGNAL_COLOR } from './AudioBaseNode'
import { audioEngine } from '../audio/AudioEngine'

interface InternalState {
    threshold: number
    knee: number
    ratio: number
    attack: number
    release: number
}

export default class CompressorControlNode extends AudioBaseNode {
    private compressor: DynamicsCompressorNode

    state: InternalState = reactive({
        threshold: -24,
        knee: 30,
        ratio: 12,
        attack: 0.003,
        release: 0.25,
    })

    constructor() {
        super(
            'Compressor',
            [new NodusPort(AUDIO_PORT_TYPE, SIGNAL_COLOR, true)],
            [new NodusPort(AUDIO_PORT_TYPE, SIGNAL_COLOR)],
            {
                title: 'Compressor',
                isPortAutoLayoutEnabled: false,
                width: 240,
            },
        )

        this.compressor = audioEngine.context.createDynamicsCompressor()
        this.applyParams()
    }

    applyParams(): void {
        const t = audioEngine.context.currentTime
        this.compressor.threshold.setTargetAtTime(this.state.threshold, t, 0.01)
        this.compressor.knee.setTargetAtTime(this.state.knee, t, 0.01)
        this.compressor.ratio.setTargetAtTime(this.state.ratio, t, 0.01)
        this.compressor.attack.setTargetAtTime(this.state.attack, t, 0.01)
        this.compressor.release.setTargetAtTime(this.state.release, t, 0.01)
    }

    getAudioOutput(_port: NodusPort): AudioNode {
        return this.compressor
    }

    getAudioInputTarget(_port: NodusPort): AudioNode {
        return this.compressor
    }

    dispose(): void {
        this.compressor.disconnect()
    }

    serialize() {
        return { ...this.state }
    }

    deserialize(data: any) {
        if (data.threshold !== undefined) this.state.threshold = data.threshold
        if (data.knee !== undefined) this.state.knee = data.knee
        if (data.ratio !== undefined) this.state.ratio = data.ratio
        if (data.attack !== undefined) this.state.attack = data.attack
        if (data.release !== undefined) this.state.release = data.release
        this.applyParams()
    }
}
