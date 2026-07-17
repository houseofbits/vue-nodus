import { NodusPort } from '@houseofbits/vue-nodus'
import { reactive } from 'vue'
import AudioBaseNode, { AUDIO_PORT_TYPE, SIGNAL_COLOR } from './AudioBaseNode'
import { audioEngine } from '../audio/AudioEngine'

interface InternalState {
    volume: number
}

/** Terminal node: volume gain wired to the engine's master output. */
export default class AudioOutputNode extends AudioBaseNode {
    private volumeGain: GainNode

    state: InternalState = reactive({
        volume: 0.8,
    })

    constructor() {
        super(
            'Output',
            [new NodusPort(AUDIO_PORT_TYPE, SIGNAL_COLOR, true)],
            [],
            {
                title: 'Output',
                isPortAutoLayoutEnabled: false,
                width: 240,
            },
        )

        this.volumeGain = audioEngine.context.createGain()
        this.volumeGain.connect(audioEngine.masterGain)
        this.applyParams()
    }

    applyParams(): void {
        this.volumeGain.gain.setTargetAtTime(
            this.state.volume,
            audioEngine.context.currentTime,
            0.01,
        )
    }

    getAudioOutput(_port: NodusPort): null {
        return null
    }

    getAudioInputTarget(_port: NodusPort): AudioNode {
        return this.volumeGain
    }

    dispose(): void {
        this.volumeGain.disconnect()
    }

    serialize() {
        return { ...this.state }
    }

    deserialize(data: any) {
        if (data.volume !== undefined) this.state.volume = data.volume
        this.applyParams()
    }
}
