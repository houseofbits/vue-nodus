import { NodusBaseNode, NodusPort } from '@houseofbits/vue-nodus'
import { reactive } from 'vue'

export interface PlotSample {
    x: number
    y: number
}

interface InternalState {
    samples: PlotSample[]
    index: number
    isRunning: boolean
    sampleCount: number
    pendingTimerId: ReturnType<typeof setTimeout> | null
}

function stepToX(step: number, sampleCount: number): number {
    return Math.round((step / sampleCount) * 1e6) / 1e6
}

export default class Plotter2DNode extends NodusBaseNode {
    state: InternalState = reactive({
        samples: [],
        index: 0,
        isRunning: false,
        sampleCount: 100,
        pendingTimerId: null,
    })

    constructor() {
        const output = new NodusPort("number", "red")
        const input = new NodusPort("number", "red")

        super(
            "Plotter2DNode",
            [input],
            [output],
            {
                title: 'Plotter 2D',
                isPortAutoLayoutEnabled: false,
                width: 450,
            }
        )
    }

    /** Starts (or restarts) the sweep: resets captured samples and emits x = 0. */
    run(): void {
        this.cancelPendingStep()
        this.state.samples = []
        this.state.index = 0
        this.state.isRunning = true
        this.outputs[0].value = stepToX(0, this.state.sampleCount)
    }

    /** Halts the sweep in place. Captured samples are left as-is so they stay inspectable. */
    stop(): void {
        this.cancelPendingStep()
        this.state.isRunning = false
    }

    private cancelPendingStep(): void {
        if (this.state.pendingTimerId !== null) {
            clearTimeout(this.state.pendingTimerId)
            this.state.pendingTimerId = null
        }
    }

    /** Called when `y` arrives for the x that was last emitted; records the pair and emits the next x. */
    compute(): void {
        if (!this.state.isRunning) {
            this.run() // an upstream graph parameter changed - replot from scratch
            return
        }

        this.state.samples.push({
            x: stepToX(this.state.index, this.state.sampleCount),
            y: Number(this.inputs[0].value),
        })

        const nextIndex = this.state.index + 1
        if (nextIndex <= this.state.sampleCount) {
            this.state.index = nextIndex
            // Deferred to a macrotask so a long sweep yields to the browser between steps
            // instead of cascading through the whole graph synchronously in one blocking pass.
            this.state.pendingTimerId = setTimeout(() => {
                this.state.pendingTimerId = null
                if (!this.state.isRunning) return // stop() was called while this step was pending
                this.outputs[0].value = stepToX(nextIndex, this.state.sampleCount)
            }, 0)
        } else {
            this.state.isRunning = false
        }
    }

    serialize() {
        return { sampleCount: this.state.sampleCount }
    }

    deserialize(data: any) {
        if (data.sampleCount !== undefined) this.state.sampleCount = data.sampleCount
    }
}
