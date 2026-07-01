import { reactive } from 'vue';
import Viewport from './Viewport.js'
import PortRegistry from './PortRegistry.js'
import SelectionController from './SelectionController.js'
import { buildBezierPath } from '../helpers/svgBezier.js'
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

    _onMove = this.onMove.bind(this)
    _onMouseDown = this.onMouseDown.bind(this)
    _onMouseUp = this.onMouseUp.bind(this)
    _onWheel = this.onWheel.bind(this)
    _onKeyDown = this.onKeyDown.bind(this)

    constructor(graph: NodusGraph) {
        this.graph = graph
        this.portRegistry = new PortRegistry(this.viewport)
    }

    nodeDragStart(node: NodusBaseNode, event: MouseEvent) {
        this.selection.selectNode(node, event.shiftKey)
        this.dragStartWorld = this.viewport.screenToWorld(event.clientX, event.clientY)
        this.selection.snapshotPositions()
        this.state.isDraggingNode = true;
        if (this.selection.getSelected().length === 1) {
            this.graph.bringToFront(node)
        }
    }

    onMouseDown(event: MouseEvent) {
        if (event.button !== 2) return

        this.graph.clearPortSelection()

        this.viewport.panStart(event.clientX, event.clientY)
    }

    onMove(event: MouseEvent) {
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

    onWheel(event: WheelEvent) {
        if (!this.boardElement) {
            return
        }

        event.preventDefault();

        const rect = this.boardElement.getBoundingClientRect();
        this.viewport.applyWheel(event, rect)
    }

    onMouseUp() {
        this.state.isDraggingNode = false

        this.viewport.panStop()
    }

    onKeyDown(e: KeyboardEvent) {
        if (e.key === "Delete" || e.key === "Backspace") {
            for (const conn of this.selection.getSelectedConnections()) {
                this.graph.removeConnection(conn.id)
            }
            for (const selected of this.selection.getSelected()) {
                this.graph.removeNode(selected.node.id)
            }
            this.selection.clear()
        }
    }

    unmount() {
        if (!this.boardElement) {
            return
        }

        this.boardElement.removeEventListener('mousemove', this._onMove)
        this.boardElement.removeEventListener('mousedown', this._onMouseDown)
        this.boardElement.removeEventListener('mouseup', this._onMouseUp)
        this.boardElement.removeEventListener('wheel', this._onWheel)

        window.removeEventListener('keydown', this._onKeyDown)
    }

    mount(element: HTMLElement) {
        this.unmount()
        this.boardElement = element

        this.boardElement.addEventListener('mousemove', this._onMove)
        this.boardElement.addEventListener('mousedown', this._onMouseDown)
        this.boardElement.addEventListener('mouseup', this._onMouseUp)
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
