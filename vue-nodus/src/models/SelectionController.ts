import { ref } from 'vue';
import NodusBaseNode from './BaseNode'
import NodusConnection from './Connection'

interface SelectedNode {
    node: NodusBaseNode
    dragStartX: number
    dragStartY: number
}

export default class SelectionController {
    selectedNodes = ref<Array<SelectedNode>>([])
    selectedConnections = ref<Array<NodusConnection>>([])

    selectNode(node: NodusBaseNode, multiSelect = false) {
        if (!multiSelect) {
            this.selectedConnections.value = []
            if (!this.isSelected(node)) {
                this.selectedNodes.value = [{ node, dragStartX: 0, dragStartY: 0 }]
            }
            // If node already selected, keep the group (allows dragging multi-select)
        } else {
            if (this.isSelected(node)) {
                this.selectedNodes.value = this.selectedNodes.value.filter(n => n.node.id !== node.id)
            } else {
                this.selectedNodes.value.push({ node, dragStartX: 0, dragStartY: 0 })
            }
        }
    }

    selectConnection(connection: NodusConnection, multiSelect = false) {
        if (!multiSelect) {
            this.selectedNodes.value = []
            this.selectedConnections.value = [connection]
        } else {
            if (this.isConnectionSelected(connection)) {
                this.selectedConnections.value = this.selectedConnections.value.filter(c => c.id !== connection.id)
            } else {
                this.selectedConnections.value.push(connection)
            }
        }
    }

    isConnectionSelected(connection: NodusConnection): boolean {
        return this.selectedConnections.value.some(c => c.id === connection.id)
    }

    getSelectedConnections(): NodusConnection[] {
        return this.selectedConnections.value
    }

    clear() {
        this.selectedNodes.value = []
        this.selectedConnections.value = []
    }

    isSelected(node: NodusBaseNode): boolean {
        return this.selectedNodes.value.some(n => n.node.id === node.id)
    }

    getSelected() {
        return this.selectedNodes.value
    }

    snapshotPositions() {
        for (const selectedNode of this.selectedNodes.value) {
            selectedNode.dragStartX = selectedNode.node.internalState.x
            selectedNode.dragStartY = selectedNode.node.internalState.y
        }
    }

    applyDelta(dx: number, dy: number) {
        for (const entry of this.selectedNodes.value) {
            entry.node.setPosition(entry.dragStartX + dx, entry.dragStartY + dy)
        }
    }
}
