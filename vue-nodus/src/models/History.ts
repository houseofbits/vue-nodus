import { shallowRef } from 'vue'
import NodusSerializer from './Serializer'
import NodusBaseNode from './BaseNode'
import type PortRegistry from './PortRegistry'

/**
 * Undo/redo for a `NodusBoard`, built on top of `NodusSerializer`'s full-graph snapshot contract.
 * Access via `board.history`.
 *
 * A node factory must be registered once via `setNodeFactory()` before `undo()`/`redo()` can
 * restore anything - the same factory shape used by `NodusSerializer.deserialize()`.
 *
 * Not every mutation is auto-tracked: node drags, node/connection deletes, and interactive
 * connection creation (`NodusGraph.selectPort()`) push undo points automatically. Programmatic
 * changes made directly via `graph.addNode()`/`graph.removeNode()` etc. are not - call
 * `snapshot()` yourself immediately beforehand if such a change should be undoable.
 *
 * @example
 * board.history.setNodeFactory((componentId) => {
 *   switch (componentId) {
 *     case 'my-node': return new MyNode()
 *     default: throw new Error(`Unknown node type: ${componentId}`)
 *   }
 * })
 */

/** A single entry in `NodusHistory.records`, describing one past action. */
export interface NodusHistoryRecord {
    label: string
}

/**
 * A node's display name for history labels: its title, falling back to componentId if unset.
 * Typed structurally (not as the full `NodusBaseNode` class) so it also accepts nodes read back
 * out of a Vue `ref`, whose `UnwrapRef` mapped type strips private class members.
 */
export function nodeDisplayName(node: Pick<NodusBaseNode, 'internalState' | 'componentId'>): string {
    return node.internalState.title || node.componentId
}

interface HistoryStackEntry {
    label: string
    snapshot: string
}

export default class NodusHistory {
    private undoStack = shallowRef<HistoryStackEntry[]>([])
    private redoStack = shallowRef<HistoryStackEntry[]>([])
    private nodeFactory?: (componentId: string, data: any) => NodusBaseNode
    private portRegistry?: PortRegistry
    private isRestoring = false

    constructor(
        private serializer: NodusSerializer,
        private maxSize: number = 50,
    ) {}

    /** Register the factory used to reconstruct node instances when restoring a snapshot. */
    setNodeFactory(factory: (componentId: string, data: any) => NodusBaseNode) {
        this.nodeFactory = factory
    }

    /** Register the port registry to recalculate port positions after `undo()`/`redo()` restore a snapshot. */
    setPortRegistry(portRegistry: PortRegistry) {
        this.portRegistry = portRegistry
    }

    canUndo(): boolean {
        return this.undoStack.value.length > 0
    }

    canRedo(): boolean {
        return this.redoStack.value.length > 0
    }

    /** Past actions available to undo, oldest first. Render this to build a history list/panel. */
    get records(): NodusHistoryRecord[] {
        return this.undoStack.value.map((entry) => ({ label: entry.label }))
    }

    /** Capture the current state without recording it. Pair with `commitGesture()` to bracket a continuous gesture like a drag. */
    captureSnapshot(): string {
        return JSON.stringify(this.serializer.serialize())
    }

    /** Push the current state as an undo point. Call immediately before an instantaneous mutation (delete, connect). */
    snapshot(label: string) {
        if (this.isRestoring) return
        this.pushUndo(this.captureSnapshot(), label)
    }

    /**
     * End a gesture bracketed by an earlier `captureSnapshot()` call. Pushes `before` as an undo
     * point only if the state actually changed since then - a click with no movement is a no-op.
     */
    commitGesture(before: string, label: string) {
        if (this.isRestoring) return
        if (before === this.captureSnapshot()) return
        this.pushUndo(before, label)
    }

    undo() {
        if (!this.canUndo()) return
        this.assertFactory()

        const entry = this.undoStack.value.at(-1)!
        this.undoStack.value = this.undoStack.value.slice(0, -1)
        this.redoStack.value = [...this.redoStack.value, { label: entry.label, snapshot: this.captureSnapshot() }]
        this.restore(entry.snapshot)
    }

    redo() {
        if (!this.canRedo()) return
        this.assertFactory()

        const entry = this.redoStack.value.at(-1)!
        this.redoStack.value = this.redoStack.value.slice(0, -1)
        this.undoStack.value = [...this.undoStack.value, { label: entry.label, snapshot: this.captureSnapshot() }]
        this.restore(entry.snapshot)
    }

    private restore(snapshotJson: string) {
        this.isRestoring = true
        try {
            this.serializer.deserialize(JSON.parse(snapshotJson), this.nodeFactory!)
            this.serializer.graph.evaluate()
            this.portRegistry?.scheduleUpdateAll()
        } finally {
            this.isRestoring = false
        }
    }

    private pushUndo(snapshotJson: string, label: string) {
        const next = [...this.undoStack.value, { label, snapshot: snapshotJson }]
        this.undoStack.value = next.length > this.maxSize ? next.slice(next.length - this.maxSize) : next
        this.redoStack.value = []
    }

    private assertFactory() {
        if (!this.nodeFactory) {
            throw new Error('[vue-nodus] Call history.setNodeFactory() before using undo()/redo().')
        }
    }
}
