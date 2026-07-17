import { NodusPort } from '@houseofbits/vue-nodus'
import { reactive } from 'vue'
import AudioBaseNode, { AUDIO_PORT_TYPE, SIGNAL_COLOR } from './AudioBaseNode'
import { audioEngine } from '../audio/AudioEngine'

interface InternalState {
    time: number
    feedback: number
}

/** Wet-only delay with an internal feedback loop (delay → feedback gain → delay). */
export default class DelayControlNode extends AudioBaseNode {
    private delay: DelayNode
    private feedbackGain: GainNode

    state: InternalState = reactive({
        time: 0.3,
        feedback: 0.4,
    })

    constructor() {
        super(
            'Delay',
            [new NodusPort(AUDIO_PORT_TYPE, SIGNAL_COLOR, true)],
            [new NodusPort(AUDIO_PORT_TYPE, SIGNAL_COLOR)],
            {
                title: 'Delay',
                isPortAutoLayoutEnabled: false,
                width: 240,
            },
        )

        this.delay = audioEngine.context.createDelay(2)
        this.feedbackGain = audioEngine.context.createGain()
        this.delay.connect(this.feedbackGain)
        this.feedbackGain.connect(this.delay)
        this.applyParams()
    }

    applyParams(): void {
        const t = audioEngine.context.currentTime
        this.delay.delayTime.setTargetAtTime(this.state.time, t, 0.01)
        this.feedbackGain.gain.setTargetAtTime(this.state.feedback, t, 0.01)
    }

    getAudioOutput(_port: NodusPort): AudioNode {
        return this.delay
    }

    getAudioInputTarget(_port: NodusPort): AudioNode {
        return this.delay
    }

    dispose(): void {
        this.delay.disconnect()
        this.feedbackGain.disconnect()
    }

    serialize() {
        return { ...this.state }
    }

    deserialize(data: any) {
        if (data.time !== undefined) this.state.time = data.time
        if (data.feedback !== undefined) this.state.feedback = data.feedback
        this.applyParams()
    }
}
