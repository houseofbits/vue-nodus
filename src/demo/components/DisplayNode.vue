<template>
    <div class="demo-node-content">
        <VNodeRow :input-port="props.node.inputs[0]">
            <span class="port-label">Value</span>
        </VNodeRow>
        <div class="display-value">
            {{ displayValue }}
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { VNodeRow } from '../../components'
import DisplayNode from '../nodes/DisplayNode'

const props = defineProps<{ node: DisplayNode }>()

const displayValue = computed(() => {
    const val = props.node.inputs[0].value
    if (val === undefined || val === null) return '—'
    if (typeof val === 'number') return Number.isInteger(val) ? val : val.toFixed(4)
    return String(val)
})
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

.display-value {
    font-size: 20px;
    font-weight: 700;
    color: #1a237e;
    background: #e8eaf6;
    border-radius: 4px;
    padding: 6px 10px;
    text-align: center;
    min-height: 32px;
    font-variant-numeric: tabular-nums;
}
</style>
