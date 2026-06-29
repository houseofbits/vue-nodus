<template>
    <svg v-for="connection in board.graph.connections" :key="connection[0]" class="connections">
        <g :transform="cameraStyle">
            <path :d="getSVGPath(connection[1])" :stroke="connection[1].color" fill="none"
                stroke-width="4" />
        </g>
    </svg>
    <svg v-if="board.graph.selectedPort.value" class="connections">
        <g :transform="cameraStyle">
            <path :d="getActiveSVGPath(board.graph.selectedPort.value)"
                :stroke="board.graph.selectedPort.value.color" fill="none" stroke-width="4" />
        </g>
    </svg>
</template>

<script lang="ts" setup>

import { inject, computed } from 'vue'
import { Board, Connection, Port } from '../models';

const board = inject<Board>('board')
if (!board) throw new Error('VConnectionsLayer must be used inside VGraph')

function getSVGPath(connection: Connection): string {
    try {
        return board.view.getSVGPath(connection)
    } catch {
        return ''
    }
}

function getActiveSVGPath(port: Port): string {
    try {
        return board.view.getActiveSVGPath(port) ?? ''
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
</style>