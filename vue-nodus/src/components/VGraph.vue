<template>
    <div
        ref="boardEl"
        class="graph-board"
        :class="{ grid: !$slots.background }"
        :style="boardStyle"
        @click="onBoardClick"
        @contextmenu.prevent
    >
        <div class="background-layer">
            <slot
                name="background"
                :pan-x="props.board.view.viewport.state.panX"
                :pan-y="props.board.view.viewport.state.panY"
                :zoom="props.board.view.viewport.state.zoom"
            />
        </div>

        <VConnectionsLayer />

        <div class="transform-wrapper" :style="transformStyle">
            <template v-for="[id, node] of props.board.graph.nodes" :key="node.id">
                <template v-if="node.isThinComponent">
                    <VBaseNode
                        :key="'base-' + node.id"
                        :node="node"
                        :is-selected="isSelected(node)"
                        :data-node-id="node.id"
                        class="enable-pointer-events"
                        :style="getNodeStyle(node)"
                        @pointerdown="(e: PointerEvent) => onNodeClick(e, node)"
                    >
                        <template #content>
                            <component
                                :is="getComponent(node)"
                                :key="'comp-' + node.id"
                                :node="node"
                            />
                        </template>
                    </VBaseNode>
                </template>

                <component
                    :is="getComponent(node)"
                    v-else
                    :key="id"
                    :node="node"
                    :is-selected="isSelected(node)"
                    :data-node-id="node.id"
                    :style="getNodeStyle(node)"
                    class="enable-pointer-events"
                    @pointerdown="(e: PointerEvent) => onNodeClick(e, node)"
                />
            </template>

            <slot />

            <div
                v-if="props.board.view.state.isBoxSelecting"
                class="nodus-selection-box"
                :style="selectionBoxStyle"
            />
        </div>
    </div>
</template>

<script lang="ts" setup>
import { NodusBaseNode, NodusBoard } from '../models'
import { computed, onMounted, onUnmounted, provide, ref } from 'vue'
import type { PropType } from 'vue'
import VConnectionsLayer from './VConnectionsLayer.vue'
import VBaseNode from './VBaseNode.vue'
import type { NodusTheme } from '../theme.js'

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

defineSlots<{
    default?(): unknown
    background?(props: { panX: number; panY: number; zoom: number }): unknown
}>()

const boardEl = ref<HTMLElement>()

provide('board', props.board)

const transformStyle = computed(() => {
    return {
        transform: `
            translate(${props.board.view.viewport.state.panX}px,
                        ${props.board.view.viewport.state.panY}px)
            scale(${props.board.view.viewport.state.zoom})`,
        transformOrigin: '0 0',
    }
})

function smoothstep(edge0: number, edge1: number, x: number) {
    const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1)
    return t * t * (3 - 2 * t)
}

const gridTransformStyle = computed(() => {
    const zoom = props.board.view.viewport.state.zoom
    const zoomOutFactor = 1 - smoothstep(0.6, 0.8, zoom)
    const zoomInFactor = smoothstep(1.2, 1.4, zoom)
    const gridSpacing = 20 + 20 * zoomOutFactor - 10 * zoomInFactor

    return {
        '--grid-size': `${gridSpacing * zoom}px`,
        '--grid-x': `${props.board.view.viewport.state.panX}px`,
        '--grid-y': `${props.board.view.viewport.state.panY}px`,
    }
})

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
        '--nodus-selection-box-border-color': t.selectionBoxBorderColor,
        '--nodus-selection-box-bg': t.selectionBoxBg,
        '--nodus-node-title-bg': t.nodeTitleBg,
        '--nodus-node-title-color': t.nodeTitleColor,
        '--nodus-node-title-border-color': t.nodeTitleBorderColor,
        '--nodus-node-title-bottom-border': t.nodeTitleBottomBorder,
        '--nodus-node-content-bg': t.nodeContentBg,
        '--nodus-node-content-border-color': t.nodeContentBorderColor,
        '--nodus-port-size': t.portSize,
        '--nodus-port-hover-outline-color': t.portHoverOutlineColor,
        '--nodus-port-hover-outline-width': t.portHoverOutlineWidth,
        '--nodus-resize-handle-color': t.resizeHandleColor,
        '--nodus-resize-handle-size': t.resizeHandleSize,
        '--nodus-connection-width': t.connectionWidth,
        '--nodus-connection-selection-color': t.connectionSelectionColor,
        '--nodus-connection-selection-width': t.connectionSelectionWidth,
    }
    return Object.fromEntries(Object.entries(map).filter(([, v]) => v !== undefined))
})

const boardStyle = computed(() => ({ ...gridTransformStyle.value, ...themeVars.value }))

const selectionBoxStyle = computed(() => {
    const state = props.board.view.state
    return {
        left: `${Math.min(state.boxStartX, state.mouseX)}px`,
        top: `${Math.min(state.boxStartY, state.mouseY)}px`,
        width: `${Math.abs(state.mouseX - state.boxStartX)}px`,
        height: `${Math.abs(state.mouseY - state.boxStartY)}px`,
    }
})

function onBoardClick(event: MouseEvent) {
    if (props.board.view.suppressNextBoardClick) {
        props.board.view.suppressNextBoardClick = false
        return
    }

    const clickedNode = (event.target as Element).closest('.nodus-node')

    if (!clickedNode) {
        props.board.view.selection.clear()
        props.board.graph.clearPortSelection()
    }
}

function isWithinDragHandle(nodeRoot: Element, target: Element | null): boolean {
    if (!target) return false
    const hasHandle =
        nodeRoot.matches('.nodus-drag-handle') ||
        nodeRoot.querySelector('.nodus-drag-handle') !== null
    return !hasHandle || target.closest('.nodus-drag-handle') !== null
}

function onNodeClick(event: PointerEvent, node: NodusBaseNode) {
    const nodeRoot = event.currentTarget as Element | null
    const target = event.target as Element | null

    if (nodeRoot && isWithinDragHandle(nodeRoot, target)) {
        props.board.view.nodeDragStart(node, event)
    } else {
        props.board.view.selectNode(node, event)
    }
}

function isSelected(node: NodusBaseNode) {
    return props.board.view.selection.isSelected(node)
}

function getNodeStyle(node: NodusBaseNode) {
    const values: Record<string, string | number> = {
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
    touch-action: none;
}

.background-layer {
    position: absolute;
    inset: 0;
}

.transform-wrapper {
    position: fixed;
    width: 100%;
    height: 100%;
    pointer-events: none;
}

.enable-pointer-events {
    pointer-events: all;
    touch-action: none;
}

.nodus-selection-box {
    position: absolute;
    pointer-events: none;
    border: 1px solid var(--nodus-selection-box-border-color, rgba(120, 170, 255, 0.9));
    background: var(--nodus-selection-box-bg, rgba(120, 170, 255, 0.12));
}

.grid {
    position: absolute;
    inset: 0;

    --grid-size: 20px;
    --dot-size: var(--nodus-grid-dot-size, 1.5px);

    background-image: radial-gradient(
        circle,
        var(--nodus-grid-dot-color, rgba(120, 170, 255, 0.18)) 0%,
        var(--nodus-grid-dot-color, rgba(120, 170, 255, 0.18)) calc(var(--dot-size) * 0.6),
        transparent var(--dot-size)
    );

    background-size: var(--grid-size) var(--grid-size);

    background-position: var(--grid-x) var(--grid-y);
}
</style>
