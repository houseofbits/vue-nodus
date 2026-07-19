import AudioBaseNode from './AudioBaseNode'

/**
 * Base class for nodes that emit clock ticks (sample-accurate AudioContext
 * times) rather than an audio signal. Consumers detect a compatible upstream
 * node with `otherNode instanceof ClockSourceNode` inside their own
 * `onPortConnected` override, then call `subscribeTick` directly — clock
 * connections carry no native Web Audio wiring of their own.
 */
export default abstract class ClockSourceNode extends AudioBaseNode {
    private subscribers = new Set<(time: number) => void>()

    /** Registers a tick listener; call the returned function to unsubscribe. */
    subscribeTick(cb: (time: number) => void): () => void {
        this.subscribers.add(cb)
        return () => this.subscribers.delete(cb)
    }

    protected emitTick(time: number): void {
        this.subscribers.forEach((cb) => cb(time))
    }
}
