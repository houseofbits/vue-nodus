import { NodusPort, type NodusBaseNode } from '@houseofbits/vue-nodus'
import { reactive } from 'vue'
import AudioBaseNode, { AUDIO_PORT_TYPE, PARAM_COLOR, SIGNAL_COLOR } from './AudioBaseNode'
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
    private blendModAnalyser: AnalyserNode
    private blendModBuffer: Float32Array<ArrayBuffer>
    private modRafId: number | null = null

    state: InternalState = reactive({
        blend: 0.5,
    })

    constructor() {
        super(
            'Blend',
            [
                new NodusPort(AUDIO_PORT_TYPE, SIGNAL_COLOR, true),
                new NodusPort(AUDIO_PORT_TYPE, SIGNAL_COLOR, true),
                new NodusPort(AUDIO_PORT_TYPE, PARAM_COLOR),
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
        this.blendModAnalyser = ctx.createAnalyser()
        this.blendModAnalyser.fftSize = 32
        this.blendModBuffer = new Float32Array(this.blendModAnalyser.fftSize)
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
        if (port === this.inputs[0]) return this.gainA
        if (port === this.inputs[1]) return this.gainB
        return this.blendModAnalyser
    }

    onPortConnected(port: NodusPort, otherNode: NodusBaseNode, otherPort: NodusPort): void {
        super.onPortConnected(port, otherNode, otherPort)
        if (port === this.inputs[2] && this.modRafId === null) {
            this.pollBlendMod()
        }
    }

    onPortDisconnected(port: NodusPort, otherNode: NodusBaseNode, otherPort: NodusPort): void {
        super.onPortDisconnected(port, otherNode, otherPort)
        if (port === this.inputs[2] && this.modRafId !== null) {
            cancelAnimationFrame(this.modRafId)
            this.modRafId = null
        }
    }

    private pollBlendMod(): void {
        this.blendModAnalyser.getFloatTimeDomainData(this.blendModBuffer)
        let sum = 0
        for (const sample of this.blendModBuffer) sum += sample
        const avg = sum / this.blendModBuffer.length
        const clamped = Math.min(1, Math.max(-1, avg))
        this.state.blend = (clamped + 1) / 2
        this.applyParams()
        this.modRafId = requestAnimationFrame(() => this.pollBlendMod())
    }

    dispose(): void {
        if (this.modRafId !== null) {
            cancelAnimationFrame(this.modRafId)
            this.modRafId = null
        }
        this.gainA.disconnect()
        this.gainB.disconnect()
        this.outGain.disconnect()
        this.blendModAnalyser.disconnect()
    }

    serialize() {
        return { ...this.state }
    }

    deserialize(data: any) {
        if (data.blend !== undefined) this.state.blend = data.blend
        this.applyParams()
    }
}
