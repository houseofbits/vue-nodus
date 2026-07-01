<template>
    <div class="demo-root">
        <header class="demo-toolbar">
            <span class="demo-title">vue-nodus playground</span>
            <div class="demo-actions">
                <button class="btn" @click="saveGraph">Save</button>
                <button class="btn" @click="loadGraph" :disabled="!savedData">Load</button>
                <button class="btn btn-secondary" @click="resetGraph">Reset</button>
            </div>
            <span class="demo-hint">Right-click + drag to pan · Scroll to zoom · Click ports to connect</span>
        </header>

        <div class="demo-canvas">
            <VGraph :board="board" />
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { NodusBoard } from './models'
import { VGraph } from './components'

const savedData = ref<string | null>(null)
const board = new NodusBoard()

function saveGraph() {
    savedData.value = JSON.stringify(board.serializer.serialize())
}

function loadGraph() {
    if (!savedData.value) return
    const data = JSON.parse(savedData.value)
    board.serializer.deserialize(data, (componentId) => {
        throw new Error(`Unknown node type: ${componentId}`)
    })
}

function resetGraph() {
    const nodeIds = [...board.graph.nodes.keys()]
    nodeIds.forEach(id => board.graph.removeNode(id))
}
</script>

<style scoped>
.demo-root {
    display: flex;
    flex-direction: column;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    font-family: system-ui, sans-serif;
}

.demo-toolbar {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 16px;
    background: #1e1e2e;
    border-bottom: 1px solid #333;
    color: #ccc;
    font-size: 13px;
}

.demo-title {
    font-weight: 700;
    font-size: 14px;
    color: #fff;
    margin-right: 8px;
}

.demo-hint {
    margin-left: auto;
    font-size: 11px;
    color: #666;
}

.demo-actions {
    display: flex;
    gap: 6px;
}

.btn {
    padding: 5px 14px;
    border-radius: 4px;
    border: 1px solid #4fc3f7;
    background: transparent;
    color: #4fc3f7;
    font-size: 12px;
    cursor: pointer;
    transition: background 120ms;
}

.btn:hover:not(:disabled) {
    background: rgba(79, 195, 247, 0.15);
}

.btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
}

.btn-secondary {
    border-color: #888;
    color: #aaa;
}

.btn-secondary:hover:not(:disabled) {
    background: rgba(136, 136, 136, 0.15);
}

.demo-canvas {
    flex: 1;
    position: relative;
    overflow: hidden;
}
</style>
