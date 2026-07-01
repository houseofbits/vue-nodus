<script setup lang="ts">
import { NodusBaseNode, VNodeRow } from '@houseofbits/vue-nodus'

const props = defineProps({
    node: {
        type: NodusBaseNode,
        required: true,
    },
})
</script>

<template>
    <div class="wrapper">
        <VNodeRow :input-port="props.node.inputs[0]">
            <div class="wrapper-left">A</div>
        </VNodeRow>
        <VNodeRow :output-port="props.node.outputs[0]">
            <div class="wrapper-right">out</div>
        </VNodeRow>
        <VNodeRow :input-port="props.node.inputs[1]">
            <div class="wrapper-left">B</div>
        </VNodeRow>
    </div>
</template>

<style scoped>
.wrapper {
    padding-top: 10px;
    padding-bottom: 10px;
}

.wrapper-left {
    padding-left: 16px;
}

.wrapper-right {
    display: flex;
    justify-content: end;
    padding-right: 16px;
}

.input {
    width: 100%;
    padding: 10px 12px;
    font-size: 14px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: white;
    color: #111827;
    outline: none;
    transition: border 0.15s, box-shadow 0.15s;
}

.input::placeholder {
    color: #9ca3af;
}

.input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}

.input:disabled {
    background: #f3f4f6;
    color: #6b7280;
    cursor: not-allowed;
}
</style>