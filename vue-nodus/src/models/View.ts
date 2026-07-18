import { reactive } from 'vue'
import Viewport from './Viewport.js'
import PortRegistry from './PortRegistry.js'
import SelectionController from './SelectionController.js'
import NodusGraph from './Graph.js'
import NodusBaseNode from './BaseNode.js'
import Vector2 from '../types/Vector2'
import NodusConnection from './Connection.js'
import NodusPort, { NodusPortType } from './Port.js'
import NodusConnectionTypeRegistry from './connectionTypes/ConnectionTypeRegistry.js'
import type NodusConnectionType from './connectionTypes/ConnectionType.js'
import type NodusHistory from './History'
import { nodeDisplayName } from './History'

import { rectsIntersect, type Rect } from './SelectionController.js'

interface InternalState {
    isDraggingNode: boolean
    isResizingNode: boolean
    isBoxSelecting: boolean
    boxStartX: number
    boxStartY: number
    mouseX: number
    mouseY: number
}

/** Node can't be shrunk below this in either dimension while resizing. */
const MIN_RESIZE_WIDTH = 60
const MIN_RESIZE_HEIGHT = 40

export default class View {
    graph: NodusGraph
    boardElement: HTMLElement | null = null
    state: InternalState = reactive({
        isDraggingNode: false,
        isResizingNode: false,
        isBoxSelecting: false,
        boxStartX: 0,
        boxStartY: 0,
        mouseX: 0,
        mouseY: 0,
    })
    dragStartWorld: Vector2 | null = null
    /** Set by `NodusBoard` so drags, deletes, and keyboard shortcuts can record undo points. */
    history?: NodusHistory
    private dragSnapshotBefore: string | null = null
    private resizingNode: NodusBaseNode | null = null
    private resizeStartWorld: Vector2 | null = null
    private resizeStartWidth = 0
    private resizeStartHeight = 0
    private resizeSnapshotBefore: string | null = null
    private boxSelectAdditive = false
    private boxSelectBaseNodes: NodusBaseNode[] = []
    private boxSelectBaseConnections: NodusConnection[] = []
    private boxSelectNodeRects = new Map<NodusBaseNode, Rect>()
    private boxSelectConnectionRects = new Map<NodusConnection, Rect>()
    /** Set after a completed drag-select so `VGraph`'s board click handler doesn't clear the fresh selection. */
    suppressNextBoardClick = false

    viewport = new Viewport()
    portRegistry: PortRegistry
    selection = new SelectionController()
    connectionTypeRegistry: NodusConnectionTypeRegistry

    activePointers = new Map<number, Vector2>()

    _onMove = this.onMove.bind(this)
    _onPointerDown = this.onPointerDown.bind(this)
    _onPointerUp = this.onPointerUp.bind(this)
    _onWheel = this.onWheel.bind(this)
    _onKeyDown = this.onKeyDown.bind(this)

    constructor(
        graph: NodusGraph,
        connectionTypeRegistry: NodusConnectionTypeRegistry = new NodusConnectionTypeRegistry(),
    ) {
        this.graph = graph
        this.portRegistry = new PortRegistry(this.viewport)
        this.connectionTypeRegistry = connectionTypeRegistry
    }

    /** Resolve the `NodusConnectionType` that renders `connection`, falling back to `'bezier'`. */
    getConnectionType(connection: NodusConnection): NodusConnectionType {
        return (
            this.connectionTypeRegistry.get(connection.connectionType) ??
            this.connectionTypeRegistry.get('bezier')!
        )
    }

    /** Select `node` (respecting shift-click multi-select) and raise it to front. Does not arm dragging. */
    selectNode(node: NodusBaseNode, event: MouseEvent) {
        this.selection.selectNode(node, event.shiftKey)
        if (this.selection.getSelected().length === 1) {
            this.graph.bringToFront(node)
        }
    }

    /** Select `node` and begin tracking a drag gesture for the current pointer. */
    nodeDragStart(node: NodusBaseNode, event: MouseEvent) {
        this.selectNode(node, event)
        this.dragStartWorld = this.viewport.screenToWorld(event.clientX, event.clientY)
        this.selection.snapshotPositions()
        this.state.isDraggingNode = true
        this.dragSnapshotBefore = this.history?.captureSnapshot() ?? null
    }

    /** Select `node` and begin tracking a resize gesture for the current pointer. */
    nodeResizeStart(node: NodusBaseNode, event: MouseEvent) {
        this.selectNode(node, event)
        this.resizingNode = node
        this.resizeStartWorld = this.viewport.screenToWorld(event.clientX, event.clientY)
        const size = this.measureNodeSize(node) ?? { width: MIN_RESIZE_WIDTH, height: MIN_RESIZE_HEIGHT }
        this.resizeStartWidth = size.width
        this.resizeStartHeight = size.height
        this.state.isResizingNode = true
        this.resizeSnapshotBefore = this.history?.captureSnapshot() ?? null
    }

    onPointerDown(event: PointerEvent) {
        this.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY })

        if (this.activePointers.size === 2) {
            this.boxSelectCancel()
            this.viewport.pinchStart(this.pinchDistance())
            return
        }

        if (this.activePointers.size > 2) return

        const isTouchPanStart =
            event.pointerType === 'touch' && !this.isInteractiveTarget(event.target)

        if (event.button !== 2 && !isTouchPanStart) {
            const isBoxSelectStart =
                event.button === 0 &&
                event.pointerType !== 'touch' &&
                !this.isInteractiveTarget(event.target)

            if (isBoxSelectStart) this.boxSelectStart(event)
            return
        }

        this.graph.clearPortSelection()

        this.viewport.panStart(event.clientX, event.clientY)
    }

    private boxSelectStart(event: PointerEvent) {
        this.graph.clearPortSelection()

        const world = this.viewport.screenToWorld(event.clientX, event.clientY)
        this.state.boxStartX = world.x
        this.state.boxStartY = world.y
        this.state.mouseX = world.x
        this.state.mouseY = world.y
        this.state.isBoxSelecting = true
        this.boxSelectAdditive = event.shiftKey

        // Shift-drag extends the current selection; the box only ever adds on top of this base.
        // Cast: Vue's ref unwrapping erases the class type (private members) from `entry.node`.
        this.boxSelectBaseNodes = this.boxSelectAdditive
            ? this.selection.getSelected().map((entry) => entry.node as NodusBaseNode)
            : []
        this.boxSelectBaseConnections = this.boxSelectAdditive
            ? [...this.selection.getSelectedConnections()]
            : []

        // Nothing can move while a marquee is active, so bounds are snapshotted once per
        // gesture - measuring auto-sized nodes on every pointermove would force a reflow each.
        this.boxSelectNodeRects.clear()
        for (const node of this.graph.nodes.values()) {
            const rect = this.getNodeWorldRect(node)
            if (rect) this.boxSelectNodeRects.set(node, rect)
        }
        this.boxSelectConnectionRects.clear()
        for (const connection of this.graph.connections.values()) {
            const rect = this.getConnectionWorldRect(connection)
            if (rect) this.boxSelectConnectionRects.set(connection, rect)
        }
    }

    private currentBoxRect(): Rect {
        return {
            x: Math.min(this.state.boxStartX, this.state.mouseX),
            y: Math.min(this.state.boxStartY, this.state.mouseY),
            width: Math.abs(this.state.mouseX - this.state.boxStartX),
            height: Math.abs(this.state.mouseY - this.state.boxStartY),
        }
    }

    /** A near-zero drag is a plain click - it shouldn't touch the selection. */
    private isBoxDragReal(rect: Rect): boolean {
        const clickThresholdPx = 4
        const zoom = this.viewport.state.zoom
        return rect.width * zoom >= clickThresholdPx || rect.height * zoom >= clickThresholdPx
    }

    private updateBoxSelection() {
        const rect = this.currentBoxRect()
        if (!this.isBoxDragReal(rect)) return

        const nodes = [...this.boxSelectBaseNodes]
        for (const [node, nodeRect] of this.boxSelectNodeRects) {
            if (rectsIntersect(rect, nodeRect) && !nodes.includes(node)) {
                nodes.push(node)
            }
        }

        const connections = [...this.boxSelectBaseConnections]
        for (const [connection, connectionRect] of this.boxSelectConnectionRects) {
            if (rectsIntersect(rect, connectionRect) && !connections.includes(connection)) {
                connections.push(connection)
            }
        }

        this.selection.selectMany(nodes, false, connections)
    }

    private boxSelectEnd() {
        if (this.isBoxDragReal(this.currentBoxRect())) {
            this.updateBoxSelection()
            this.suppressNextBoardClick = true
        }
        this.boxSelectCancel()
    }

    private boxSelectCancel() {
        this.state.isBoxSelecting = false
        this.boxSelectBaseNodes = []
        this.boxSelectBaseConnections = []
        this.boxSelectNodeRects.clear()
        this.boxSelectConnectionRects.clear()
    }

    /** Node's current rendered size, measuring the DOM when it auto-sizes. `null` if unmeasurable. */
    private measureNodeSize(node: NodusBaseNode): { width: number; height: number } | null {
        let width = node.internalState.width
        let height = node.internalState.height

        if (width === null || height === null) {
            const element = this.boardElement?.querySelector(`[data-node-id="${node.id}"]`)
            if (element) {
                const domRect = element.getBoundingClientRect()
                const zoom = this.viewport.state.zoom
                width = width ?? domRect.width / zoom
                height = height ?? domRect.height / zoom
            }
        }

        if (width === null || height === null) return null

        return { width, height }
    }

    /** World-space bounding box of `node`, measuring the DOM when it auto-sizes. `null` if unmeasurable. */
    private getNodeWorldRect(node: NodusBaseNode): Rect | null {
        const size = this.measureNodeSize(node)
        if (!size) return null

        return { x: node.internalState.x, y: node.internalState.y, ...size }
    }

    /** World-space bounding box of `connection`'s endpoints. `null` when either port is unmeasured. */
    private getConnectionWorldRect(connection: NodusConnection): Rect | null {
        const source = this.portRegistry.get(connection.sourcePortId)
        const target = this.portRegistry.get(connection.targetPortId)
        if (!source || !target) return null

        return {
            x: Math.min(source.x, target.x),
            y: Math.min(source.y, target.y),
            width: Math.abs(target.x - source.x),
            height: Math.abs(target.y - source.y),
        }
    }

    private isInteractiveTarget(target: EventTarget | null): boolean {
        if (!(target instanceof Element)) return false
        return target.closest('.nodus-node') !== null || target.closest('.port') !== null
    }

    private isEditableTarget(target: EventTarget | null): boolean {
        if (!(target instanceof Element)) return false
        if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return true
        if ((target as HTMLElement).isContentEditable) return true
        return target.closest('[contenteditable="true"], [contenteditable=""]') !== null
    }

    onMove(event: PointerEvent) {
        if (this.activePointers.has(event.pointerId)) {
            this.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
        }

        if (this.activePointers.size === 2) {
            this.updatePinch()
            return
        }

        const mouseWOrld = this.viewport.screenToWorld(event.clientX, event.clientY)

        this.state.mouseX = mouseWOrld.x
        this.state.mouseY = mouseWOrld.y

        if (this.state.isBoxSelecting) {
            this.updateBoxSelection()
        }

        if (this.state.isDraggingNode && this.dragStartWorld) {
            const world = this.viewport.screenToWorld(event.clientX, event.clientY)

            const dx = world.x - this.dragStartWorld.x
            const dy = world.y - this.dragStartWorld.y

            this.selection.applyDelta(dx, dy)
        }

        if (this.state.isResizingNode && this.resizingNode && this.resizeStartWorld) {
            const world = this.viewport.screenToWorld(event.clientX, event.clientY)

            const dx = world.x - this.resizeStartWorld.x
            const dy = world.y - this.resizeStartWorld.y

            const width = Math.max(MIN_RESIZE_WIDTH, this.resizeStartWidth + dx)
            const height = Math.max(MIN_RESIZE_HEIGHT, this.resizeStartHeight + dy)

            this.resizingNode.setSize(width, height)
        }

        this.viewport.applyPan(event.clientX, event.clientY)

        this.portRegistry.scheduleUpdateAll()
    }

    private pinchDistance(): number {
        const [a, b] = this.activePointers.values()
        return Math.hypot(a.x - b.x, a.y - b.y)
    }

    private updatePinch() {
        if (!this.boardElement) return

        const rect = this.boardElement.getBoundingClientRect()
        const [a, b] = this.activePointers.values()

        const midX = (a.x + b.x) / 2 - rect.left
        const midY = (a.y + b.y) / 2 - rect.top

        this.viewport.applyPinch(this.pinchDistance(), midX, midY)
    }

    onWheel(event: WheelEvent) {
        if (!this.boardElement) {
            return
        }

        event.preventDefault()

        const rect = this.boardElement.getBoundingClientRect()
        this.viewport.applyWheel(event, rect)
    }

    onPointerUp(event: PointerEvent) {
        this.activePointers.delete(event.pointerId)

        if (this.state.isBoxSelecting) {
            this.boxSelectEnd()
        }

        if (this.state.isDraggingNode && this.dragSnapshotBefore !== null) {
            this.history?.commitGesture(this.dragSnapshotBefore, this.describeDragLabel())
        }
        this.dragSnapshotBefore = null

        this.state.isDraggingNode = false

        if (this.state.isResizingNode && this.resizeSnapshotBefore !== null) {
            this.history?.commitGesture(this.resizeSnapshotBefore, this.describeResizeLabel())
        }
        this.resizeSnapshotBefore = null

        this.state.isResizingNode = false
        this.resizingNode = null
        this.resizeStartWorld = null

        this.viewport.panStop()
    }

    onKeyDown(e: KeyboardEvent) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (this.isEditableTarget(e.target)) return

            this.deleteSelected()
            return
        }

        const isUndoRedoModifier = e.metaKey || e.ctrlKey
        const key = e.key.toLowerCase()

        if (isUndoRedoModifier && key === 'z') {
            if (this.isEditableTarget(e.target)) return

            e.preventDefault()
            if (e.shiftKey) {
                this.history?.redo()
            } else {
                this.history?.undo()
            }
            return
        }

        // Ctrl/Cmd+Y is the conventional Windows/Linux redo shortcut, offered alongside Ctrl/Cmd+Shift+Z.
        if (isUndoRedoModifier && key === 'y') {
            if (this.isEditableTarget(e.target)) return

            e.preventDefault()
            this.history?.redo()
        }
    }

    /** Delete every currently selected node and connection. */
    deleteSelected() {
        if (this.selection.getSelected().length === 0 && this.selection.getSelectedConnections().length === 0) {
            return
        }

        this.history?.snapshot(this.describeDeleteLabel())
        for (const conn of this.selection.getSelectedConnections()) {
            this.graph.removeConnection(conn.id)
        }
        for (const selected of this.selection.getSelected()) {
            this.graph.removeNode(selected.node.id)
        }
        this.selection.clear()
    }

    /** Delete a single node (and its connections), regardless of the current selection. */
    deleteNode(node: NodusBaseNode) {
        this.history?.snapshot(`Node "${nodeDisplayName(node)}" deleted`)
        this.graph.removeNode(node.id)
        this.selection.clear()
    }

    /** Delete a single connection, regardless of the current selection. */
    deleteConnection(connection: NodusConnection) {
        this.history?.snapshot(`Connection "${this.describeConnectionLabel(connection)}" deleted`)
        this.graph.removeConnection(connection.id)
        this.selection.clear()
    }

    private describeDragLabel(): string {
        const nodes = this.selection.getSelected()
        if (nodes.length === 1) return `Node "${nodeDisplayName(nodes[0].node)}" moved`
        return 'Node group moved'
    }

    private describeResizeLabel(): string {
        if (!this.resizingNode) return 'Node resized'
        return `Node "${nodeDisplayName(this.resizingNode)}" resized`
    }

    private describeConnectionLabel(connection: NodusConnection): string {
        const source = this.graph.getNodeByPortId(connection.sourcePortId)
        const target = this.graph.getNodeByPortId(connection.targetPortId)
        if (!source || !target) return 'Connection'
        return `${nodeDisplayName(source)} → ${nodeDisplayName(target)}`
    }

    private describeDeleteLabel(): string {
        const nodes = this.selection.getSelected()
        const connections = this.selection.getSelectedConnections()

        if (nodes.length === 0 && connections.length === 1) {
            return `Connection "${this.describeConnectionLabel(connections[0])}" deleted`
        }
        if (nodes.length === 0) return `${connections.length} connections deleted`
        if (connections.length === 0 && nodes.length === 1) return `Node "${nodeDisplayName(nodes[0].node)}" deleted`
        if (connections.length === 0) return 'Node group deleted'
        return `${nodes.length + connections.length} items deleted`
    }

    unmount() {
        if (!this.boardElement) {
            return
        }

        this.boardElement.removeEventListener('pointermove', this._onMove)
        this.boardElement.removeEventListener('pointerdown', this._onPointerDown)
        this.boardElement.removeEventListener('pointerup', this._onPointerUp)
        this.boardElement.removeEventListener('pointercancel', this._onPointerUp)
        this.boardElement.removeEventListener('wheel', this._onWheel)

        window.removeEventListener('keydown', this._onKeyDown)
    }

    mount(element: HTMLElement) {
        this.unmount()
        this.boardElement = element

        this.boardElement.addEventListener('pointermove', this._onMove)
        this.boardElement.addEventListener('pointerdown', this._onPointerDown)
        this.boardElement.addEventListener('pointerup', this._onPointerUp)
        this.boardElement.addEventListener('pointercancel', this._onPointerUp)
        this.boardElement.addEventListener('wheel', this._onWheel, { passive: false })

        window.addEventListener('keydown', this._onKeyDown)
    }

    getSVGPath(connection: NodusConnection) {
        const source = this.portRegistry.get(connection.sourcePortId)
        const target = this.portRegistry.get(connection.targetPortId)

        if (source === undefined || target === undefined) {
            throw Error('Port not found')
        }

        return this.getConnectionType(connection).buildPath(source.x, source.y, target.x, target.y, false)
    }

    getConnectionMidpoint(connection: NodusConnection): Vector2 {
        const source = this.portRegistry.get(connection.sourcePortId)
        const target = this.portRegistry.get(connection.targetPortId)

        if (source === undefined || target === undefined) {
            throw Error('Port not found')
        }

        return this.getConnectionType(connection).getMidpoint(source.x, source.y, target.x, target.y, false)
    }

    getActiveSVGPath(sourcePort: NodusPort) {
        if (!sourcePort) return

        const source = this.portRegistry.get(sourcePort.id)

        if (source === undefined) {
            throw Error('Port not found')
        }

        // No target port exists yet during a drag, so there's nothing to resolve against -
        // the live preview always previews as bezier, matching the pre-existing behavior.
        return this.connectionTypeRegistry.get('bezier')!.buildPath(
            source.x,
            source.y,
            this.state.mouseX,
            this.state.mouseY,
            sourcePort.ioType === NodusPortType.Input,
        )
    }

    getBoardCenterPosition() {
        if (!this.boardElement) {
            throw new Error('Board element missing')
        }

        const rect = this.boardElement.getBoundingClientRect()

        const screenX = rect.width / 2
        const screenY = rect.height / 2

        return this.viewport.screenToWorld(screenX, screenY)
    }
}
