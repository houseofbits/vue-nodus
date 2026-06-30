<template>
    <div class="demo-node-content">
        <VNodeRow :input-port="props.node.inputs[0]">
            <span class="port-label">A</span>
        </VNodeRow>
        <VNodeRow :input-port="props.node.inputs[1]">
            <span class="port-label">B</span>
        </VNodeRow>
        <div class="operation-row">
            <select v-model="props.node.state.operation" class="demo-select">
                <option value="add">Add  (A + B)</option>
                <option value="subtract">Subtract  (A − B)</option>
                <option value="multiply">Multiply  (A × B)</option>
                <option value="divide">Divide  (A ÷ B)</option>
            </select>
        </div>
        <VNodeRow :output-port="props.node.outputs[0]">
            <span class="port-label result-label">Result</span>
        </VNodeRow>
    </div>
</template>

<script lang="ts" setup>
import { watch } from 'vue'
import { VNodeRow } from '../../components'
import MathNode from '../nodes/MathNode'

const props = defineProps<{ node: MathNode }>()

watch(() => props.node.state.operation, () => props.node.compute())
</script>

<style scoped>
.demo-node-content {
    padding: 6px 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.port-label {
    font-size: 12px;
    color: #444;
    padding: 2px 4px;
    user-select: none;
}

.result-label {
    color: #2e7d32;
    font-weight: 600;
}

.operation-row {
    padding: 4px 0;
}

.demo-select {
    width: 100%;
    box-sizing: border-box;
    padding: 4px 6px;
    border-radius: 4px;
    border: 1px solid #aaa;
    background: #fff;
    font-size: 12px;
    color: #333;
    cursor: pointer;
    outline: none;
}

.demo-select:focus {
    border-color: #81c784;
    box-shadow: 0 0 0 2px rgba(129, 199, 132, 0.3);
}
</style>
