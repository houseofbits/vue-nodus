<template>
    <div class="graph-board grid" ref="boardEl" @click="onBoardClick" @contextmenu.prevent :style="boardStyle">
        <VConnectionsLayer />

        <div class="transform-wrapper" :style="transformStyle">
            <template v-for="node in props.board.graph.nodes">
                <template v-if="node[1].isThinComponent">
                    <VBaseNode :key="node[0]" :node="node[1]" :is-selected="isSelected(node[1])"
                        class="enable-pointer-events" :style="getNodeStyle(node[1])"
                        @mousedown="e => onNodeClick(e, node[1])">
                        <template #content>
                            <component :is="getComponent(node[1])" :node="node[1]" />
                        </template>
                    </VBaseNode>
                </template>

                <component v-else :is="getComponent(node[1])" :key="node[0]" :node="node[1]"
                    :is-selected="isSelected(node[1])" :style="getNodeStyle(node[1])" class="enable-pointer-events"
                    @mousedown="e => onNodeClick(e, node[1])" />
            </template>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { NodusBaseNode, NodusBoard } from '../models';
import { computed, onMounted, onUnmounted, provide, ref } from 'vue';
import type { PropType } from 'vue';
import VConnectionsLayer from './VConnectionsLayer.vue';
import VBaseNode from './VBaseNode.vue';
import type { NodusTheme } from '../theme.js';

const props = defineProps({
    board: {
        type: NodusBoard,
        required: true,
    },
    theme: {
        type: Object as PropType<Partial<NodusTheme>>,
        default: () => ({}),
    },
})

const boardEl = ref<HTMLElement>();

provide('board', props.board)

const transformStyle = computed(() => {
    return {
        transform: `
            translate(${props.board.view.viewport.state.panX}px,
                        ${props.board.view.viewport.state.panY}px)
            scale(${props.board.view.viewport.state.zoom})`,
        transformOrigin: '0 0',
    };
});

const gridTransformStyle = computed(() => {
    let gridSpacing = 20;
    if (props.board.view.viewport.state.zoom < 0.7) {
        gridSpacing = 40
    } else if (props.board.view.viewport.state.zoom > 1.3) {
        gridSpacing = 10
    }

    return {
        '--grid-size': `${gridSpacing * props.board.view.viewport.state.zoom}px`,
        '--grid-x': `${props.board.view.viewport.state.panX * props.board.view.viewport.state.zoom}px`,
        '--grid-y': `${props.board.view.viewport.state.panY * props.board.view.viewport.state.zoom}px`
    };
});

const themeVars = computed(() => {
    const t = props.theme ?? {}
    const map: Record<string, string | number | undefined> = {
        '--nodus-canvas-bg': t.canvasBg,
        '--nodus-grid-dot-color': t.gridDotColor,
        '--nodus-grid-dot-size': t.gridDotSize,
        '--nodus-node-border-radius': t.nodeBorderRadius,
        '--nodus-node-shadow': t.nodeShadow,
        '--nodus-node-selection-color': t.nodeSelectionColor,
        '--nodus-node-selection-width': t.nodeSelectionWidth,
        '--nodus-node-title-bg': t.nodeTitleBg,
        '--nodus-node-title-color': t.nodeTitleColor,
        '--nodus-node-title-border-color': t.nodeTitleBorderColor,
        '--nodus-node-title-bottom-border': t.nodeTitleBottomBorder,
        '--nodus-node-content-bg': t.nodeContentBg,
        '--nodus-node-content-border-color': t.nodeContentBorderColor,
        '--nodus-port-size': t.portSize,
        '--nodus-port-hover-outline-color': t.portHoverOutlineColor,
        '--nodus-port-hover-outline-width': t.portHoverOutlineWidth,
        '--nodus-connection-width': t.connectionWidth,
        '--nodus-connection-selection-color': t.connectionSelectionColor,
        '--nodus-connection-selection-width': t.connectionSelectionWidth,
    }
    return Object.fromEntries(Object.entries(map).filter(([, v]) => v !== undefined))
})

const boardStyle = computed(() => ({ ...gridTransformStyle.value, ...themeVars.value }))

function onBoardClick(event: MouseEvent) {
    const clickedNode = (event.target as Element).closest('.nodus-node')

    if (!clickedNode) {
        props.board.view.selection.clear()
        props.board.graph.clearPortSelection()
    }
}

function onNodeClick(event: MouseEvent, node: NodusBaseNode) {
    props.board.view.nodeDragStart(node, event);
}

function isSelected(node: NodusBaseNode) {
    return props.board.view.selection.isSelected(node)
}

function getNodeStyle(node: NodusBaseNode) {
    const values: Record<string, any> = {
        left: `${node.internalState.x}px`,
        top: `${node.internalState.y}px`,
        zIndex: node.internalState.zIndex,
    }

    if (node.internalState.width !== null) {
        values['width'] = `${node.internalState.width}px`
    }

    if (node.internalState.height !== null) {
        values['height'] = `${node.internalState.height}px`
    }

    return values
}

function getComponent(node: NodusBaseNode) {
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
    background-color: var(--nodus-canvas-bg, rgb(48, 48, 48));
}

.transform-wrapper {
    position: fixed;
    width: 100%;
    height: 100%;
    pointer-events: none;
}

.enable-pointer-events {
    pointer-events: all;
}

.grid {
    position: absolute;
    inset: 0;

    --grid-size: 20px;
    --dot-size: var(--nodus-grid-dot-size, 1.5px);

    background-image:
        radial-gradient(circle,
            var(--nodus-grid-dot-color, rgba(120, 170, 255, 0.18)) var(--dot-size),
            transparent var(--dot-size));

    background-size: var(--grid-size) var(--grid-size);

    background-position: var(--grid-x) var(--grid-y);
}
</style>