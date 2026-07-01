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
    <div class="py-2.5">
        <VNodeRow :input-port="props.node.inputs[0]">
            <div class="pl-4">A</div>
        </VNodeRow>
        <VNodeRow :output-port="props.node.outputs[0]">
            <div class="flex justify-end pr-4">out</div>
        </VNodeRow>
        <VNodeRow :input-port="props.node.inputs[1]">
            <div class="pl-4">B</div>
        </VNodeRow>
    </div>
</template>