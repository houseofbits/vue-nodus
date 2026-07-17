import { NodusPort } from '@houseofbits/vue-nodus'
import AudioBaseNode, { AUDIO_PORT_TYPE, SIGNAL_COLOR } from './AudioBaseNode'
import { audioEngine } from '../audio/AudioEngine'

/** Looping white-noise source. */
export default class NoiseSourceNode extends AudioBaseNode {
    private source: AudioBufferSourceNode

    constructor() {
        super(
            'Noise',
            [],
            [new NodusPort(AUDIO_PORT_TYPE, SIGNAL_COLOR)],
            {
                title: 'Noise',
                isPortAutoLayoutEnabled: false,
                width: 240,
            },
        )

        const ctx = audioEngine.context
        const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
        const samples = buffer.getChannelData(0)
        for (let i = 0; i < samples.length; i++) {
            samples[i] = Math.random() * 2 - 1
        }

        this.source = ctx.createBufferSource()
        this.source.buffer = buffer
        this.source.loop = true
        this.source.start()
    }

    getAudioOutput(_port: NodusPort): AudioNode {
        return this.source
    }

    getAudioInputTarget(_port: NodusPort): null {
        return null
    }

    dispose(): void {
        try {
            this.source.stop()
        } catch {
            // Already stopped.
        }
        this.source.disconnect()
    }
}
