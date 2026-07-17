import { NodusPort } from '@houseofbits/vue-nodus'
import AudioBaseNode, { AUDIO_PORT_TYPE, SIGNAL_COLOR } from './AudioBaseNode'
import { audioEngine } from '../audio/AudioEngine'

/** Pass-through waveform display. The component reads `analyser` each frame. */
export default class AnalyserDisplayNode extends AudioBaseNode {
    readonly analyser: AnalyserNode

    constructor() {
        super(
            'Analyser',
            [new NodusPort(AUDIO_PORT_TYPE, SIGNAL_COLOR, true)],
            [new NodusPort(AUDIO_PORT_TYPE, SIGNAL_COLOR)],
            {
                title: 'Analyser',
                isPortAutoLayoutEnabled: false,
                width: 320,
            },
        )

        this.analyser = audioEngine.context.createAnalyser()
        this.analyser.fftSize = 2048
    }

    getAudioOutput(_port: NodusPort): AudioNode {
        return this.analyser
    }

    getAudioInputTarget(_port: NodusPort): AudioNode {
        return this.analyser
    }

    dispose(): void {
        this.analyser.disconnect()
    }
}
