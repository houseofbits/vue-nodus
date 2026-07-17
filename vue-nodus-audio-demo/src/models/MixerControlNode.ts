import { NodusPort } from '@houseofbits/vue-nodus'
import { reactive } from 'vue'
import AudioBaseNode, { AUDIO_PORT_TYPE, SIGNAL_COLOR } from './AudioBaseNode'
import { audioEngine } from '../audio/AudioEngine'

const CHANNEL_COUNT = 4

interface ChannelState {
    level: number
    pan: number
}

interface InternalState {
    channels: ChannelState[]
}

/**
 * Sums up to four tracks into one output, with per-channel level and stereo
 * pan: channel GainNode → StereoPannerNode → shared output GainNode.
 */
export default class MixerControlNode extends AudioBaseNode {
    private channelGains: GainNode[]
    private channelPanners: StereoPannerNode[]
    private outGain: GainNode

    state: InternalState = reactive({
        channels: Array.from({ length: CHANNEL_COUNT }, () => ({ level: 0.8, pan: 0 })),
    })

    constructor() {
        super(
            'Mixer',
            Array.from(
                { length: CHANNEL_COUNT },
                () => new NodusPort(AUDIO_PORT_TYPE, SIGNAL_COLOR, true),
            ),
            [new NodusPort(AUDIO_PORT_TYPE, SIGNAL_COLOR)],
            {
                title: 'Mixer',
                isPortAutoLayoutEnabled: false,
                width: 260,
            },
        )

        const ctx = audioEngine.context
        this.outGain = ctx.createGain()
        this.channelGains = []
        this.channelPanners = []
        for (let i = 0; i < CHANNEL_COUNT; i++) {
            const gain = ctx.createGain()
            const panner = ctx.createStereoPanner()
            gain.connect(panner)
            panner.connect(this.outGain)
            this.channelGains.push(gain)
            this.channelPanners.push(panner)
        }
        this.applyParams()
    }

    applyParams(): void {
        const t = audioEngine.context.currentTime
        this.state.channels.forEach((channel, i) => {
            this.channelGains[i].gain.setTargetAtTime(channel.level, t, 0.01)
            this.channelPanners[i].pan.setTargetAtTime(channel.pan, t, 0.01)
        })
    }

    getAudioOutput(_port: NodusPort): AudioNode {
        return this.outGain
    }

    getAudioInputTarget(port: NodusPort): AudioNode | null {
        const index = this.inputs.indexOf(port)
        return this.channelGains[index] ?? null
    }

    dispose(): void {
        for (const gain of this.channelGains) gain.disconnect()
        for (const panner of this.channelPanners) panner.disconnect()
        this.outGain.disconnect()
    }

    serialize() {
        return { channels: this.state.channels.map((c) => ({ ...c })) }
    }

    deserialize(data: any) {
        if (Array.isArray(data.channels)) {
            this.state.channels.forEach((channel, i) => {
                const saved = data.channels[i]
                if (!saved) return
                if (saved.level !== undefined) channel.level = saved.level
                if (saved.pan !== undefined) channel.pan = saved.pan
            })
        }
        this.applyParams()
    }
}
