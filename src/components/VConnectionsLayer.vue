<template>
    <svg v-for="connection in board.graph.connections" :key="connection[0]" class="connections">
        <g :transform="cameraStyle">
            <path :d="board.view.getSVGPath(connection[1])" stroke="white" fill="none" stroke-width="4" />
        </g>
    </svg>
    <svg v-if="board.graph.selectedPort.value" class="connections">
        <g :transform="cameraStyle">
            <path :d="board.view.getActiveSVGPath(board.graph.selectedPort.value)" stroke="white" fill="none"
                stroke-width="4" />
        </g>
    </svg>
</template>

<script lang="ts" setup>

import { inject, computed } from 'vue'
import { Board } from '../models';

const board = inject('board') as Board

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