<template>
    <svg class="connections">
        <g :transform="cameraStyle">
            <template
            v-for="[id, connection] in board.graph.connections"
            :key="id"
            >
            <!-- Invisible hit area -->
            <path
                :d="getSVGPath(connection)"
                fill="none"
                stroke="transparent"
                stroke-width="16"
                style="cursor:pointer"
                @click.stop="selectConnection(connection, $event)"
            />

            <!-- Selection outline -->
            <path
                v-if="board.view.selection.isConnectionSelected(connection)"
                :d="getSVGPath(connection)"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
                :style="{ stroke: 'var(--nodus-connection-selection-color, white)', strokeWidth: 'var(--nodus-connection-selection-width, 12)' }"
            />

            <!-- Visible connection -->
            <path
                :d="getSVGPath(connection)"
                :stroke="connection.color"
                fill="none"
                :style="{ strokeWidth: 'var(--nodus-connection-width, 4)' }"
                @click.stop="selectConnection(connection, $event)"
            />

            <!-- Touch delete marker -->
            <g
                v-if="board.view.selection.isConnectionSelected(connection)"
                class="nodus-connection-delete-btn"
                :transform="deleteMarkerTransform(connection)"
                @click.stop="board?.view.deleteConnection(connection)"
            >
                <circle r="10" :fill="'var(--nodus-connection-delete-bg, rgba(0, 0, 0, 0.55))'" />
                <text
                    text-anchor="middle"
                    dominant-baseline="central"
                    :fill="'var(--nodus-connection-delete-color, white)'"
                    font-size="14"
                >&times;</text>
            </g>
            </template>
        </g>
    </svg>
    <svg v-if="board.graph.selectedPort.value" class="connections">
        <g :transform="cameraStyle">
            <path :d="getActiveSVGPath(board.graph.selectedPort.value)" :stroke="board.graph.selectedPort.value.color"
                fill="none" :style="{ strokeWidth: 'var(--nodus-connection-width, 4)' }" />
        </g>
    </svg>
</template>

<script lang="ts" setup>

import { inject, computed } from 'vue'
import { NodusBoard, NodusConnection, NodusPort } from '../models';

const board = inject<NodusBoard>('board')
if (!board) throw new Error('VConnectionsLayer must be used inside VGraph')

function getSVGPath(connection: NodusConnection): string | undefined {
    try {
        return board?.view.getSVGPath(connection)
    } catch {
        return undefined
    }
}

function getActiveSVGPath(port: NodusPort): string | undefined {
    try {
        return board?.view.getActiveSVGPath(port) ?? ''
    } catch {
        return undefined
    }
}

function selectConnection(connection: NodusConnection, event: MouseEvent) {
    board?.view.selection.selectConnection(connection, event.shiftKey)
    board?.graph.clearPortSelection()
}

function deleteMarkerTransform(connection: NodusConnection): string {
    try {
        const mid = board?.view.getConnectionMidpoint(connection)
        if (!mid) return ''
        return `translate(${mid.x}, ${mid.y})`
    } catch {
        return ''
    }
}

const cameraStyle = computed(() => {
    return `translate(${board.view.viewport.state.panX}, ${board.view.viewport.state.panY}) scale(${board.view.viewport.state.zoom})`
})

</script>

<style scoped>
.connections {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

.nodus-connection-delete-btn {
    display: none;
    cursor: pointer;
}

@media (hover: none), (pointer: coarse) {
    .nodus-connection-delete-btn {
        display: block;
    }
}
</style>