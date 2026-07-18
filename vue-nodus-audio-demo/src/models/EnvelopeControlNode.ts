import { NodusPort } from '@houseofbits/vue-nodus'
import { reactive } from 'vue'
import AudioBaseNode, { AUDIO_PORT_TYPE, PARAM_COLOR } from './AudioBaseNode'
import { audioEngine } from '../audio/AudioEngine'

interface InternalState {
    attack: number
    decay: number
    sustain: number
    release: number
    peak: number
}

/**
 * Manually-triggered ADSR envelope, output as a `ConstantSourceNode` for
 * wiring into any param-mod input (e.g. a Gain's `gain mod` with the Gain
 * slider at 0). Uses the same chained `setTargetAtTime` technique as
 * StepSequencerNode's gate output, just driven by a UI trigger pad instead
 * of the step clock.
 */
export default class EnvelopeControlNode extends AudioBaseNode {
    private envSource: ConstantSourceNode

    state: InternalState = reactive({
        attack: 0.05,
        decay: 0.2,
        sustain: 0.6,
        release: 0.3,
        peak: 1,
    })

    constructor() {
        super('Envelope', [], [new NodusPort(AUDIO_PORT_TYPE, PARAM_COLOR)], {
            title: 'Envelope',
            isPortAutoLayoutEnabled: false,
            width: 240,
        })

        this.envSource = audioEngine.context.createConstantSource()
        this.envSource.offset.value = 0
        this.envSource.start()
    }

    trigger(): void {
        const t = audioEngine.context.currentTime
        const offset = this.envSource.offset
        offset.setTargetAtTime(this.state.peak, t, Math.max(0.003, this.state.attack / 3))
        offset.setTargetAtTime(
            this.state.sustain * this.state.peak,
            t + this.state.attack,
            Math.max(0.003, this.state.decay / 3),
        )
    }

    release(): void {
        const t = audioEngine.context.currentTime
        this.envSource.offset.setTargetAtTime(0, t, Math.max(0.003, this.state.release / 3))
    }

    getAudioOutput(_port: NodusPort): AudioNode {
        return this.envSource
    }

    getAudioInputTarget(_port: NodusPort): null {
        return null
    }

    dispose(): void {
        try {
            this.envSource.stop()
        } catch {
            // Already stopped.
        }
        this.envSource.disconnect()
    }

    serialize() {
        return { ...this.state }
    }

    deserialize(data: any) {
        if (data.attack !== undefined) this.state.attack = data.attack
        if (data.decay !== undefined) this.state.decay = data.decay
        if (data.sustain !== undefined) this.state.sustain = data.sustain
        if (data.release !== undefined) this.state.release = data.release
        if (data.peak !== undefined) this.state.peak = data.peak
    }
}
