import { NodusPort } from '@houseofbits/vue-nodus'
import { reactive } from 'vue'
import AudioBaseNode, { AUDIO_PORT_TYPE, SIGNAL_COLOR } from './AudioBaseNode'
import { audioEngine } from '../audio/AudioEngine'

const CURVE_SAMPLES = 1024

interface InternalState {
    drive: number
    level: number
}

function makeCurve(amount: number): Float32Array<ArrayBuffer> {
    const curve = new Float32Array(CURVE_SAMPLES) as Float32Array<ArrayBuffer>
    const deg = Math.PI / 180
    for (let i = 0; i < CURVE_SAMPLES; i++) {
        const x = (i * 2) / CURVE_SAMPLES - 1
        curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x))
    }
    return curve
}

/** Distortion: WaveShaperNode with a drive-controlled curve, then an output-level gain. */
export default class WaveshaperControlNode extends AudioBaseNode {
    private shaper: WaveShaperNode
    private postGain: GainNode

    state: InternalState = reactive({
        drive: 0.4,
        level: 0.7,
    })

    constructor() {
        super(
            'Waveshaper',
            [new NodusPort(AUDIO_PORT_TYPE, SIGNAL_COLOR, true)],
            [new NodusPort(AUDIO_PORT_TYPE, SIGNAL_COLOR)],
            {
                title: 'Waveshaper',
                isPortAutoLayoutEnabled: false,
                width: 240,
            },
        )

        const ctx = audioEngine.context
        this.shaper = ctx.createWaveShaper()
        this.shaper.oversample = '4x'
        this.postGain = ctx.createGain()
        this.shaper.connect(this.postGain)
        this.applyParams()
    }

    applyParams(): void {
        this.shaper.curve = makeCurve(this.state.drive * 100)
        this.postGain.gain.setTargetAtTime(this.state.level, audioEngine.context.currentTime, 0.01)
    }

    getAudioOutput(_port: NodusPort): AudioNode {
        return this.postGain
    }

    getAudioInputTarget(_port: NodusPort): AudioNode {
        return this.shaper
    }

    dispose(): void {
        this.shaper.disconnect()
        this.postGain.disconnect()
    }

    serialize() {
        return { ...this.state }
    }

    deserialize(data: any) {
        if (data.drive !== undefined) this.state.drive = data.drive
        if (data.level !== undefined) this.state.level = data.level
        this.applyParams()
    }
}
