const LOOKAHEAD_MS = 25
const SCHEDULE_AHEAD_S = 0.1

/**
 * Coarse JS interval that schedules every tick falling within the next
 * SCHEDULE_AHEAD_S seconds of audio-clock time, so callbacks always receive
 * sample-accurate AudioContext times even though the interval itself is not.
 */
export default class LookaheadScheduler {
    private timer: number | null = null
    private nextTickTime = 0
    private getCurrentTime: () => number
    private onTick: (time: number) => void
    private tickInterval: () => number

    constructor(getCurrentTime: () => number, onTick: (time: number) => void, tickInterval: () => number) {
        this.getCurrentTime = getCurrentTime
        this.onTick = onTick
        this.tickInterval = tickInterval
    }

    start(startDelay = 0.05): void {
        if (this.timer !== null) return
        this.nextTickTime = this.getCurrentTime() + startDelay
        this.timer = window.setInterval(() => this.poll(), LOOKAHEAD_MS)
    }

    stop(): void {
        if (this.timer !== null) {
            clearInterval(this.timer)
            this.timer = null
        }
    }

    get isRunning(): boolean {
        return this.timer !== null
    }

    private poll(): void {
        const now = this.getCurrentTime()
        while (this.nextTickTime < now + SCHEDULE_AHEAD_S) {
            this.onTick(this.nextTickTime)
            this.nextTickTime += this.tickInterval()
        }
    }
}
