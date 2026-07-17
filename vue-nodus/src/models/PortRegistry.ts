import { reactive } from 'vue'
import Vector2 from '../types/Vector2'
import Viewport from './Viewport'

export default class PortRegistry {
    portElements: Map<string, HTMLElement> = new Map()
    portPositions: Map<string, Vector2> = reactive(new Map())
    viewport: Viewport

    private updateScheduled = false

    constructor(viewport: Viewport) {
        this.viewport = viewport
    }

    /** Coalesce updateAll() calls to run once per animation frame, after Vue has flushed pan/drag DOM patches. */
    scheduleUpdateAll() {
        if (this.updateScheduled) return
        this.updateScheduled = true
        requestAnimationFrame(() => {
            this.updateScheduled = false
            this.updateAll()
        })
    }

    register(portId: string, element: HTMLElement) {
        this.portElements.set(portId, element)
        this.update(portId)
    }

    unregister(portId: string) {
        this.portElements.delete(portId)
        this.portPositions.delete(portId)
    }

    updateAll() {
        for (const portId of this.portElements.keys()) {
            this.update(portId)
        }
    }

    update(portId: string) {
        const el = this.portElements.get(portId)

        if (!el) {
            return
        }

        const rect = el.getBoundingClientRect()

        const worldSpace = this.viewport.screenToWorld(rect.left, rect.top)
        const elementWidth = rect.width / this.viewport.state.zoom
        const elementHeight = rect.height / this.viewport.state.zoom

        const x = worldSpace.x + elementWidth * 0.5
        const y = worldSpace.y + elementHeight * 0.5

        this.portPositions.set(portId, { x, y })
    }

    get(portId: string): Vector2 | undefined {
        return this.portPositions.get(portId)
    }
}
