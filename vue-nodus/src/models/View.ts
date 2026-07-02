import { reactive } from 'vue';
import Viewport from './Viewport.js'
import PortRegistry from './PortRegistry.js'
import SelectionController from './SelectionController.js'
import { buildBezierPath, getBezierMidpoint } from '../helpers/svgBezier.js'
import NodusGraph from './Graph.js';
import NodusBaseNode from './BaseNode.js';
import Vector2 from '../types/Vector2'
import NodusConnection from './Connection.js';
import NodusPort, { NodusPortType } from './Port.js';

interface InternalState {
    isDraggingNode: boolean
    mouseX: number
    mouseY: number
}

export default class View {
    graph: NodusGraph
    boardElement: HTMLElement | null = null
    state: InternalState = reactive({
        isDraggingNode: false,
        mouseX: 0,
        mouseY: 0,
    });
    dragStartWorld: Vector2 | null = null

    viewport = new Viewport()
    portRegistry: PortRegistry
    selection = new SelectionController()

    activePointers = new Map<number, Vector2>()

    _onMove = this.onMove.bind(this)
    _onPointerDown = this.onPointerDown.bind(this)
    _onPointerUp = this.onPointerUp.bind(this)
    _onWheel = this.onWheel.bind(this)
    _onKeyDown = this.onKeyDown.bind(this)

    constructor(graph: NodusGraph) {
        this.graph = graph
        this.portRegistry = new PortRegistry(this.viewport)
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
        this.state.isDraggingNode = true;
    }

    onPointerDown(event: PointerEvent) {
        this.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY })

        if (this.activePointers.size === 2) {
            this.viewport.pinchStart(this.pinchDistance())
            return
        }

        if (this.activePointers.size > 2) return

        const isTouchPanStart = event.pointerType === 'touch' && !this.isInteractiveTarget(event.target)

        if (event.button !== 2 && !isTouchPanStart) return

        this.graph.clearPortSelection()

        this.viewport.panStart(event.clientX, event.clientY)
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

        if (this.state.isDraggingNode && this.dragStartWorld) {
            const world = this.viewport.screenToWorld(event.clientX, event.clientY);

            const dx = world.x - this.dragStartWorld.x;
            const dy = world.y - this.dragStartWorld.y;

            this.selection.applyDelta(dx, dy)
        }

        this.viewport.applyPan(event.clientX, event.clientY)

        this.portRegistry.updateAll()
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

        event.preventDefault();

        const rect = this.boardElement.getBoundingClientRect();
        this.viewport.applyWheel(event, rect)
    }

    onPointerUp(event: PointerEvent) {
        this.activePointers.delete(event.pointerId)

        this.state.isDraggingNode = false

        this.viewport.panStop()
    }

    onKeyDown(e: KeyboardEvent) {
        if (e.key === "Delete" || e.key === "Backspace") {
            if (this.isEditableTarget(e.target)) return

            this.deleteSelected()
        }
    }

    /** Delete every currently selected node and connection. */
    deleteSelected() {
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
        this.graph.removeNode(node.id)
        this.selection.clear()
    }

    /** Delete a single connection, regardless of the current selection. */
    deleteConnection(connection: NodusConnection) {
        this.graph.removeConnection(connection.id)
        this.selection.clear()
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
        const source = this.portRegistry.get(connection.sourcePortId);
        const target = this.portRegistry.get(connection.targetPortId);

        if (source === undefined || target === undefined) {
            throw Error('Port not found')
        }

        return buildBezierPath(
            source.x, source.y,
            target.x, target.y,
            false
        );
    }

    getConnectionMidpoint(connection: NodusConnection): Vector2 {
        const source = this.portRegistry.get(connection.sourcePortId);
        const target = this.portRegistry.get(connection.targetPortId);

        if (source === undefined || target === undefined) {
            throw Error('Port not found')
        }

        return getBezierMidpoint(source.x, source.y, target.x, target.y, false)
    }

    getActiveSVGPath(sourcePort: NodusPort) {
        if (!sourcePort) return;

        const source = this.portRegistry.get(sourcePort.id);

        if (source === undefined) {
            throw Error('Port not found')
        }

        return buildBezierPath(
            source.x, source.y,
            this.state.mouseX,
            this.state.mouseY,
            sourcePort.ioType === NodusPortType.Input
        );
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
