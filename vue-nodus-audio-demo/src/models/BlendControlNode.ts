import { NodusPort } from '@houseofbits/vue-nodus'
import { reactive } from 'vue'
import AudioBaseNode, { AUDIO_PORT_TYPE, SIGNAL_COLOR } from './AudioBaseNode'
import { audioEngine } from '../audio/AudioEngine'

interface InternalState {
    /** 0 = full A, 1 = full B. */
    blend: number
}

/** Equal-power crossfade between two signals: gainA/gainB summed into one output. */
export default class BlendControlNode extends AudioBaseNode {
    private gainA: GainNode
    private gainB: GainNode
    private outGain: GainNode

    state: InternalState = reactive({
        blend: 0.5,
    })

    constructor() {
        super(
            'Blend',
            [
                new NodusPort(AUDIO_PORT_TYPE, SIGNAL_COLOR, true),
                new NodusPort(AUDIO_PORT_TYPE, SIGNAL_COLOR, true),
            ],
            [new NodusPort(AUDIO_PORT_TYPE, SIGNAL_COLOR)],
            {
                title: 'Blend',
                isPortAutoLayoutEnabled: false,
                width: 240,
            },
        )

        const ctx = audioEngine.context
        this.gainA = ctx.createGain()
        this.gainB = ctx.createGain()
        this.outGain = ctx.createGain()
        this.gainA.connect(this.outGain)
        this.gainB.connect(this.outGain)
        this.applyParams()
    }

    applyParams(): void {
        const t = audioEngine.context.currentTime
        const angle = (this.state.blend * Math.PI) / 2
        this.gainA.gain.setTargetAtTime(Math.cos(angle), t, 0.01)
        this.gainB.gain.setTargetAtTime(Math.sin(angle), t, 0.01)
    }

    getAudioOutput(_port: NodusPort): AudioNode {
        return this.outGain
    }

    getAudioInputTarget(port: NodusPort): AudioNode {
        return port === this.inputs[0] ? this.gainA : this.gainB
    }

    dispose(): void {
        this.gainA.disconnect()
        this.gainB.disconnect()
        this.outGain.disconnect()
    }

    serialize() {
        return { ...this.state }
    }

    deserialize(data: any) {
        if (data.blend !== undefined) this.state.blend = data.blend
        this.applyParams()
    }
}
