import { reactive, watch } from 'vue'
import type { NodusBaseNode, NodusBoard } from '@houseofbits/vue-nodus'
import AudioBaseNode from '../models/AudioBaseNode'

/**
 * Owns the shared AudioContext and master output. The context is created
 * eagerly (it starts suspended under the browser autoplay policy) so node
 * models can create their native AudioNodes in constructors and the preset
 * patch can be wired before the first user gesture. The Power button provides
 * the gesture via resume(), and doubles as a global start/stop.
 */
class AudioEngine {
    readonly context: AudioContext
    readonly masterGain: GainNode
    readonly state = reactive({ running: false })

    constructor() {
        this.context = new AudioContext()
        this.masterGain = this.context.createGain()
        this.masterGain.connect(this.context.destination)

        // The context isn't guaranteed to start suspended (autoplay policy
        // varies by browser/settings), so track its actual state.
        this.state.running = this.context.state === 'running'
        this.context.onstatechange = () => {
            this.state.running = this.context.state === 'running'
        }
    }

    async power(): Promise<void> {
        if (this.context.state === 'running') {
            await this.context.suspend()
        } else {
            await this.context.resume()
        }
    }

    /**
     * Dispose native audio nodes when their graph node is removed. The graph
     * has no node-level teardown hook (removeNode only fires per-connection
     * disconnects), so removed nodes are detected by diffing the reactive
     * nodes Map. Also covers undo/redo, which rebuilds the whole graph.
     */
    attach(board: NodusBoard): void {
        const known = new Map<string, NodusBaseNode>(board.graph.nodes)
        watch(
            () => [...board.graph.nodes.keys()],
            () => {
                for (const [id, node] of known) {
                    // Compare instances, not just ids — preset switches can
                    // reuse node ids, replacing the instance under the same key.
                    if (board.graph.nodes.get(id) !== node && node instanceof AudioBaseNode) {
                        node.dispose()
                    }
                }
                known.clear()
                for (const [id, node] of board.graph.nodes) {
                    known.set(id, node)
                }
            },
        )
    }
}

export const audioEngine = new AudioEngine()
