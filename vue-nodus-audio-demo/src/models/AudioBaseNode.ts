import { NodusBaseNode, NodusPort, NodusPortType } from '@houseofbits/vue-nodus'

/** Port color for audio signal connections. */
export const SIGNAL_COLOR = '#34d399'
/** Port color for parameter-modulation inputs (AudioParam targets). */
export const PARAM_COLOR = '#fbbf24'

export const AUDIO_PORT_TYPE = 'audio'

/**
 * Base class for nodes that wrap native Web Audio nodes. Mirrors the visual
 * graph onto the live audio graph: every "audio" connection created or removed
 * in the editor calls connect()/disconnect() on the underlying natives.
 *
 * Native node instances are exposed only through the two accessors below —
 * never through port values, since those are persisted by the serializer
 * and history snapshots.
 */
export default abstract class AudioBaseNode extends NodusBaseNode {
    /** The native node feeding the given output port. */
    abstract getAudioOutput(port: NodusPort): AudioNode | null

    /**
     * The native destination behind the given input port: an AudioNode for
     * signal inputs, an AudioParam for modulation inputs.
     */
    abstract getAudioInputTarget(port: NodusPort): AudioNode | AudioParam | null

    /**
     * Stop sources and disconnect all wrapped natives. Called by AudioEngine
     * when this node is removed from the graph (including undo/redo rebuilds).
     */
    dispose(): void {}

    // The graph fires this hook on BOTH endpoints of a new connection; acting
    // only as the input side wires each audio edge exactly once.
    onPortConnected(port: NodusPort, otherNode: NodusBaseNode, otherPort: NodusPort): void {
        const edge = this.resolveEdge(port, otherNode, otherPort)
        if (!edge) return
        // connect() has separate AudioNode/AudioParam overloads, so narrow first.
        if (edge.target instanceof AudioParam) edge.source.connect(edge.target)
        else edge.source.connect(edge.target)
    }

    onPortDisconnected(port: NodusPort, otherNode: NodusBaseNode, otherPort: NodusPort): void {
        const edge = this.resolveEdge(port, otherNode, otherPort)
        if (!edge) return
        // The same edge can be torn down twice (removeNode cascade + dispose).
        try {
            if (edge.target instanceof AudioParam) edge.source.disconnect(edge.target)
            else edge.source.disconnect(edge.target)
        } catch {
            // Already disconnected.
        }
    }

    private resolveEdge(
        port: NodusPort,
        otherNode: NodusBaseNode,
        otherPort: NodusPort,
    ): { source: AudioNode; target: AudioNode | AudioParam } | null {
        if (port.ioType !== NodusPortType.Input || port.type !== AUDIO_PORT_TYPE) return null
        if (!(otherNode instanceof AudioBaseNode)) return null
        const source = otherNode.getAudioOutput(otherPort)
        const target = this.getAudioInputTarget(port)
        if (!source || !target) return null
        return { source, target }
    }
}
