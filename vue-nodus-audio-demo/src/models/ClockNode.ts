import { NodusPort } from '@houseofbits/vue-nodus'
import { reactive, watch, type WatchStopHandle } from 'vue'
import ClockSourceNode from './ClockSourceNode'
import { CLOCK_COLOR, CLOCK_PORT_TYPE } from './AudioBaseNode'
import { audioEngine } from '../audio/AudioEngine'
import LookaheadScheduler from '../audio/LookaheadScheduler'

interface InternalState {
    bpm: number
    /** Steps per beat — 4 = quarter notes, 8 = 8th notes, 16 = 16th notes, 32 = 32nd notes. */
    division: number
}

/**
 * Shared tempo source: emits sample-accurate ticks (AudioContext times) that
 * other nodes — e.g. the Sequencer's `clock in`, the LFO's `reset in` — can
 * subscribe to via `subscribeTick`. Runs while the shared transport is
 * running, same as the Sequencer's own internal clock.
 */
export default class ClockNode extends ClockSourceNode {
    private scheduler: LookaheadScheduler
    private stopTransportWatch: WatchStopHandle

    state: InternalState = reactive({
        bpm: 120,
        division: 16,
    })

    constructor() {
        super('Clock', [], [new NodusPort(CLOCK_PORT_TYPE, CLOCK_COLOR)], {
            title: 'Clock',
            isPortAutoLayoutEnabled: false,
            width: 220,
        })

        this.scheduler = new LookaheadScheduler(
            () => audioEngine.context.currentTime,
            (t) => this.emitTick(t),
            () => this.tickDuration(),
        )

        this.stopTransportWatch = watch(
            () => audioEngine.state.running,
            (running) => (running ? this.scheduler.start() : this.scheduler.stop()),
            { immediate: true },
        )
    }

    private tickDuration(): number {
        return (60 / this.state.bpm) * (4 / this.state.division)
    }

    getAudioOutput(_port: NodusPort): null {
        return null
    }

    getAudioInputTarget(_port: NodusPort): null {
        return null
    }

    dispose(): void {
        this.stopTransportWatch()
        this.scheduler.stop()
    }

    serialize() {
        return { ...this.state }
    }

    deserialize(data: any) {
        if (data.bpm !== undefined) this.state.bpm = data.bpm
        if (data.division !== undefined) this.state.division = data.division
    }
}
