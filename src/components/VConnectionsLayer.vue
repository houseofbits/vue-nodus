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
                stroke="white"
                stroke-width="12"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
            />

            <!-- Visible connection -->
            <path
                :d="getSVGPath(connection)"
                :stroke="connection.color"
                fill="none"
                stroke-width="4"
                @click.stop="selectConnection(connection, $event)"
            />
            </template>
        </g>
    </svg>
    <svg v-if="board.graph.selectedPort.value" class="connections">
        <g :transform="cameraStyle">
            <path :d="getActiveSVGPath(board.graph.selectedPort.value)" :stroke="board.graph.selectedPort.value.color"
                fill="none" stroke-width="4" />
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
</style>