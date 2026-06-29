import { ref } from 'vue';
import BaseNode from './BaseNode'

interface SelectedNode {
    node: BaseNode
    dragStartX: number
    dragStartY: number
}

export default class SelectionController {
    selectedNodes = ref<Array<SelectedNode>>([])

    select(node: BaseNode) {
        if (!this.isSelected(node)) {
            this.selectedNodes.value.push({ node, dragStartX: 0, dragStartY: 0 });
        }
    }

    clear() {
        this.selectedNodes.value = [];
    }

    isSelected(node: BaseNode) {
        return this.selectedNodes.value.some(n => n.node.id === node.id);
    }

    getSelected() {
        return this.selectedNodes.value;
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