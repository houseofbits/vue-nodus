<template>
    <div class="graph-board" ref="boardEl" @click="onBoardClick" @contextmenu.prevent>
        <VConnectionsLayer />

        <div class="transform-wrapper" :style="computedStyle">
            <template v-for="node in props.board.graph.nodes">
                <template v-if="node[1].isThinComponent">
                    <VBaseNode :key="node[0]" :node="node[1]" :is-selected="isSelected(node[1])"
                        :style="getNodeStyle(node[1])" @mousedown="e => onNodeClick(e, node[1])">
                        <template #content>
                            <component :is="getComponent(node[1])" :node="node[1]" />
                        </template>
                    </VBaseNode>
                </template>

                <component v-else :is="getComponent(node[1])" v-for="node in board.graph.nodes" :key="node[0]" :node="node"
                    :is-selected="isSelected(node[1])" :style="getNodeStyle(node[1])"
                    @mousedown="e => onNodeClick(e, node[1])" />
            </template>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { BaseNode, Board, Port } from '../models';
import { computed, onMounted, onUnmounted, provide, ref } from 'vue';
import VConnectionsLayer from './VConnectionsLayer.vue';
import VBaseNode from './VBaseNode.vue';

const props = defineProps({
    board: {
        type: Board,
        required: true,
    }
})

const boardEl = ref<HTMLElement>();

provide('board', props.board)

const computedStyle = computed(() => {
    return {
        transform: `
            translate(${props.board.view.viewport.state.panX}px,
                        ${props.board.view.viewport.state.panY}px)
            scale(${props.board.view.viewport.state.zoom})`,
        transformOrigin: '0 0',
    };
});

function onBoardClick(event) {
    const clickedNode = event.target.closest('.node')

    if (!clickedNode) {
        props.board.view.selection.clear()
    }
}

function onNodeClick(event: MouseEvent, node: BaseNode) {
    props.board.view.nodeDragStart(node, event);
}

function isSelected(node: BaseNode) {
    return props.board.view.selection.isSelected(node)
}

function getNodeStyle(node: BaseNode) {
    return {
        width: `${node.internalState.width}px`,
        height: `${node.internalState.height}px`,
        left: `${node.internalState.x}px`,
        top: `${node.internalState.y}px`,
        zIndex: node.internalState.zIndex,
    }
}

function getComponent(node: BaseNode) {
    return props.board.getComponent(node.componentId) ?? null
}

onMounted(() => {
    if (boardEl.value) {
        props.board.view.mount(boardEl.value)
    }
})

onUnmounted(() => {
    props.board.view.unmount()
})

</script>

<style scoped>
.graph-board {
    position: absolute;
    top: 0px;
    left: 0px;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background-color: gray;
}

.transform-wrapper {
    position: fixed;
    width: 100%;
    height: 100%;
}
</style>