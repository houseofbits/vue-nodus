<script setup lang="ts">
import { VNodeRow } from '@houseofbits/vue-nodus'
import NoiseSourceNode from '../models/NoiseSourceNode'

const props = defineProps({
    node: {
        type: NoiseSourceNode,
        required: true,
    },
})
</script>

<template>
    <div class="py-2.5 text-xs text-gray-600">
        <VNodeRow :output-port="props.node.outputs[0]">
            <div class="px-4 py-1">White noise</div>
        </VNodeRow>
    </div>
</template>
