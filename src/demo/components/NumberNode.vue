<template>
    <div class="demo-node-content">
        <VNodeRow :output-port="props.node.outputs[0]">
            <input
                type="number"
                class="demo-input"
                :value="outputValue"
                @input="onInput"
            />
        </VNodeRow>
    </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { VNodeRow } from '../../components'
import NumberNode from '../nodes/NumberNode'

const props = defineProps<{ node: NumberNode }>()

const outputValue = computed(() => props.node.outputs[0].value as number)

function onInput(e: Event) {
    props.node.outputs[0].value = Number((e.target as HTMLInputElement).value)
}
</script>

<style scoped>
.demo-node-content {
    padding: 6px 8px;
}

.demo-input {
    width: 100%;
    box-sizing: border-box;
    padding: 4px 6px;
    border-radius: 4px;
    border: 1px solid #aaa;
    background: #fff;
    font-size: 13px;
    color: #333;
    outline: none;
}

.demo-input:focus {
    border-color: #4fc3f7;
    box-shadow: 0 0 0 2px rgba(79, 195, 247, 0.3);
}
</style>
