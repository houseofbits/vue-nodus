import { NodusBaseNode, NodusPort } from '@houseofbits/vue-nodus'
import { reactive } from 'vue'
import AudioBaseNode, { AUDIO_PORT_TYPE, CLOCK_COLOR, CLOCK_PORT_TYPE, SIGNAL_COLOR } from './AudioBaseNode'
import ClockSourceNode from './ClockSourceNode'
import { audioEngine } from '../audio/AudioEngine'

interface InternalState {
    time: number
    feedback: number
}

/** Wet-only delay with an internal feedback loop (delay → feedback gain → delay). */
export default class DelayControlNode extends AudioBaseNode {
    private delay: DelayNode
    private feedbackGain: GainNode
    private unsubscribeClock: (() => void) | null = null
    private lastTickTime: number | null = null

    state: InternalState = reactive({
        time: 0.3,
        feedback: 0.4,
    })

    constructor() {
        super(
            'Delay',
            [new NodusPort(AUDIO_PORT_TYPE, SIGNAL_COLOR, true), new NodusPort(CLOCK_PORT_TYPE, CLOCK_COLOR)],
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

    /** True while a clock is driving delayTime — the Time slider is read-only meanwhile. */
    get isClockSynced(): boolean {
        return this.unsubscribeClock !== null
    }

    applyParams(): void {
        const t = audioEngine.context.currentTime
        this.delay.delayTime.setTargetAtTime(this.state.time, t, 0.01)
        this.feedbackGain.gain.setTargetAtTime(this.state.feedback, t, 0.01)
    }

    getAudioOutput(_port: NodusPort): AudioNode {
        return this.delay
    }

    getAudioInputTarget(port: NodusPort): AudioNode | null {
        return port === this.inputs[0] ? this.delay : null
    }

    onPortConnected(port: NodusPort, otherNode: NodusBaseNode, otherPort: NodusPort): void {
        super.onPortConnected(port, otherNode, otherPort)
        if (port !== this.inputs[1] || !(otherNode instanceof ClockSourceNode)) return
        this.unsubscribeClock = otherNode.subscribeTick((t) => {
            // The first tick only establishes a baseline — delayTime updates
            // from the second tick onward, once a real interval is known.
            if (this.lastTickTime !== null) {
                const interval = t - this.lastTickTime
                this.delay.delayTime.setTargetAtTime(interval, t, 0.01)
            }
            this.lastTickTime = t
        })
    }

    onPortDisconnected(port: NodusPort, otherNode: NodusBaseNode, otherPort: NodusPort): void {
        super.onPortDisconnected(port, otherNode, otherPort)
        if (port !== this.inputs[1]) return
        this.unsubscribeClock?.()
        this.unsubscribeClock = null
        this.lastTickTime = null
        this.applyParams()
    }

    dispose(): void {
        this.unsubscribeClock?.()
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
