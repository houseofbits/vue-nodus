import { reactive } from 'vue';
import Vector2 from '../types/Vector2'

interface InternalState {
    isPanning: boolean
    zoom: number
    panX: number
    panY: number
}

export default class Viewport {
    state: InternalState = reactive({
        isPanning: false,
        zoom: 1.0,
        panX: 0,
        panY: 0,
    })
    panStartScreenX = 0
    panStartScreenY = 0

    panStartPanX = 0
    panStartPanY = 0

    constructor() {

    }

    screenToWorld(x: number, y: number): Vector2 {
        return {
            x: (x - this.state.panX) / this.state.zoom,
            y: (y - this.state.panY) / this.state.zoom
        }
    }

    worldToScreen(x: number, y: number): Vector2 {
        return {
            x: x * this.state.zoom + this.state.panX,
            y: y * this.state.zoom + this.state.panY
        }
    }

    panStart(screenX: number, screenY: number) {
        this.panStartScreenX = screenX
        this.panStartScreenY = screenY

        this.panStartPanX = this.state.panX
        this.panStartPanY = this.state.panY

        this.state.isPanning = true
    }

    applyPan(screenX: number, screenY: number) {
        if (!this.state.isPanning) {
            return
        }

        const dx = screenX - this.panStartScreenX
        const dy = screenY - this.panStartScreenY

        this.state.panX = this.panStartPanX + dx
        this.state.panY = this.panStartPanY + dy
    }

    panStop() {
        this.state.isPanning = false
    }

    isPanning() {
        return this.state.isPanning
    }

    applyWheel(event: WheelEvent, rect: DOMRect) {
        const zoomSpeed = 0.1
        const oldZoom = this.state.zoom

        let newZoom = event.deltaY < 0
            ? oldZoom * (1 + zoomSpeed)
            : oldZoom / (1 + zoomSpeed)

        newZoom = Math.max(0.3, Math.min(3, newZoom))

        const mouseX = event.clientX - rect.left
        const mouseY = event.clientY - rect.top

        const worldX = (mouseX - this.state.panX) / oldZoom
        const worldY = (mouseY - this.state.panY) / oldZoom

        this.state.zoom = newZoom
        this.state.panX = mouseX - worldX * newZoom
        this.state.panY = mouseY - worldY * newZoom
    }
}