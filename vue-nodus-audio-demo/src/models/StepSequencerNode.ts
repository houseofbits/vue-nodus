import { NodusBaseNode, NodusPort } from '@houseofbits/vue-nodus'
import { reactive, watch, type WatchStopHandle } from 'vue'
import AudioBaseNode, { AUDIO_PORT_TYPE, CLOCK_COLOR, CLOCK_PORT_TYPE, PARAM_COLOR } from './AudioBaseNode'
import ClockSourceNode from './ClockSourceNode'
import { audioEngine } from '../audio/AudioEngine'
import LookaheadScheduler from '../audio/LookaheadScheduler'

const STEP_COUNT = 8

export interface SequencerStep {
    on: boolean
    /** MIDI note number. */
    note: number
}

interface InternalState {
    bpm: number
    /** Note length as a fraction of the step duration. */
    gateLength: number
    attack: number
    release: number
    /** Peak gate value — scales the lane's volume when the gate drives a gain mod. */
    level: number
    steps: SequencerStep[]
    /** Playhead position for the UI highlight; not serialized. */
    currentStep: number
    /**
     * True once an external clock has ever been wired into `clock in`. Once
     * set, BPM is ignored/hidden for good — even after the clock is
     * unplugged — mirroring hardware sequencers that simply stop advancing
     * without a clock. Not serialized; re-derived when connections restore.
     */
    clockConnected: boolean
}

function midiToHz(note: number): number {
    return 440 * Math.pow(2, (note - 69) / 12)
}

/**
 * Eight-step sequencer with two param-modulation outputs driven by
 * ConstantSourceNodes: `pitch out` (absolute note frequency in Hz — feed it
 * to an Oscillator's freq mod with the oscillator's own frequency at 0) and
 * `gate out` (a 0..level amplitude envelope per active step — feed it to a
 * Gain's gain mod with the gain slider at 0). A third output, `trig out`, is
 * clock-typed rather than audio-typed (no native Web Audio node behind it) —
 * it's how a downstream node like EnvelopeControlNode can be connected at
 * all, since the graph only allows same-type port connections and an
 * envelope's gate input can't be wired to an `audio`-typed port. `trig out`
 * fires once per loop, on step 1 only (if it's on) — not on every active
 * step — so a triggered Envelope acts as a per-bar swell rather than
 * retriggering on every note.
 *
 * Steps are scheduled on the audio clock with the standard lookahead pattern:
 * a coarse JS interval schedules everything falling in the next 100 ms. The
 * envelope uses only setTargetAtTime segments, which chain click-free from
 * whatever value the param currently has.
 */
export default class StepSequencerNode extends AudioBaseNode {
    private pitchSource: ConstantSourceNode
    private gateSource: ConstantSourceNode
    private scheduler: LookaheadScheduler
    private stepIndex = 0
    private stopTransportWatch: WatchStopHandle
    private unsubscribeClock: (() => void) | null = null
    private triggerSubscribers = new Set<(onTime: number) => void>()

    state: InternalState = reactive({
        bpm: 120,
        gateLength: 0.5,
        attack: 0.01,
        release: 0.2,
        level: 1,
        steps: Array.from({ length: STEP_COUNT }, () => ({ on: true, note: 57 })),
        currentStep: -1,
        clockConnected: false,
    })

    constructor() {
        super(
            'Sequencer',
            [new NodusPort(CLOCK_PORT_TYPE, CLOCK_COLOR)],
            [
                new NodusPort(AUDIO_PORT_TYPE, PARAM_COLOR),
                new NodusPort(AUDIO_PORT_TYPE, PARAM_COLOR),
                new NodusPort(CLOCK_PORT_TYPE, CLOCK_COLOR),
            ],
            {
                title: 'Sequencer',
                isPortAutoLayoutEnabled: false,
                width: 440,
            },
        )

        const ctx = audioEngine.context
        this.pitchSource = ctx.createConstantSource()
        this.pitchSource.offset.value = 0
        this.gateSource = ctx.createConstantSource()
        this.gateSource.offset.value = 0
        this.pitchSource.start()
        this.gateSource.start()

        this.scheduler = new LookaheadScheduler(
            () => audioEngine.context.currentTime,
            (t) => this.advanceStep(t),
            () => this.stepDuration(),
        )

        // The context clock is the transport: schedule while running, halt on
        // suspend. immediate:true covers nodes created while already running.
        this.stopTransportWatch = watch(
            () => audioEngine.state.running,
            (running) => (running ? this.startTransport() : this.stopTransport()),
            { immediate: true },
        )
    }

    getAudioOutput(port: NodusPort): AudioNode | null {
        if (port === this.outputs[0]) return this.pitchSource
        if (port === this.outputs[1]) return this.gateSource
        return null
    }

    getAudioInputTarget(_port: NodusPort): null {
        return null
    }

    onPortConnected(port: NodusPort, otherNode: NodusBaseNode, otherPort: NodusPort): void {
        super.onPortConnected(port, otherNode, otherPort)
        if (port !== this.inputs[0] || !(otherNode instanceof ClockSourceNode)) return
        this.state.clockConnected = true
        this.stopTransport()
        this.unsubscribeClock = otherNode.subscribeTick((t) => this.advanceStep(t))
    }

    onPortDisconnected(port: NodusPort, otherNode: NodusBaseNode, otherPort: NodusPort): void {
        super.onPortDisconnected(port, otherNode, otherPort)
        if (port !== this.inputs[0]) return
        this.unsubscribeClock?.()
        this.unsubscribeClock = null
        // Per design: stays clock-locked (silent) even once unplugged.
    }

    /** Registers a step-1 trigger listener; call the returned function to unsubscribe. */
    subscribeTrigger(cb: (onTime: number) => void): () => void {
        this.triggerSubscribers.add(cb)
        return () => this.triggerSubscribers.delete(cb)
    }

    dispose(): void {
        this.stopTransportWatch()
        this.unsubscribeClock?.()
        this.stopTransport()
        try {
            this.pitchSource.stop()
            this.gateSource.stop()
        } catch {
            // Already stopped.
        }
        this.pitchSource.disconnect()
        this.gateSource.disconnect()
    }

    private startTransport(): void {
        if (this.state.clockConnected) return
        this.stepIndex = 0
        this.scheduler.start()
    }

    private stopTransport(): void {
        this.scheduler.stop()
        const t = audioEngine.context.currentTime
        this.gateSource.offset.cancelScheduledValues(t)
        this.gateSource.offset.setTargetAtTime(0, t, 0.01)
        this.state.currentStep = -1
    }

    private advanceStep(t: number): void {
        this.scheduleStep(this.stepIndex, t)
        this.stepIndex = (this.stepIndex + 1) % this.state.steps.length
    }

    /** Step duration in seconds — steps are 16th notes. */
    private stepDuration(): number {
        return 60 / this.state.bpm / 4
    }

    private scheduleStep(index: number, t: number): void {
        const step = this.state.steps[index]
        const now = audioEngine.context.currentTime

        window.setTimeout(
            () => {
                this.state.currentStep = index
            },
            Math.max(0, (t - now) * 1000),
        )

        if (!step.on) return

        this.pitchSource.offset.setTargetAtTime(midiToHz(step.note), t, 0.003)

        const gate = this.gateSource.offset
        const offTime = t + this.stepDuration() * this.state.gateLength
        gate.setTargetAtTime(this.state.level, t, Math.max(0.003, this.state.attack / 3))
        gate.setTargetAtTime(0, offTime, Math.max(0.01, this.state.release / 3))

        if (index === 0) this.triggerSubscribers.forEach((cb) => cb(t))
    }

    serialize() {
        return {
            bpm: this.state.bpm,
            gateLength: this.state.gateLength,
            attack: this.state.attack,
            release: this.state.release,
            level: this.state.level,
            steps: this.state.steps.map((s) => ({ ...s })),
        }
    }

    deserialize(data: any) {
        if (data.bpm !== undefined) this.state.bpm = data.bpm
        if (data.gateLength !== undefined) this.state.gateLength = data.gateLength
        if (data.attack !== undefined) this.state.attack = data.attack
        if (data.release !== undefined) this.state.release = data.release
        if (data.level !== undefined) this.state.level = data.level
        if (Array.isArray(data.steps)) {
            this.state.steps.forEach((step, i) => {
                const saved = data.steps[i]
                if (!saved) return
                if (saved.on !== undefined) step.on = saved.on
                if (saved.note !== undefined) step.note = saved.note
            })
        }
    }
}
