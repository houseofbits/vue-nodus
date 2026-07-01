<script setup lang="ts">
import { VNodeRow } from '@houseofbits/vue-nodus'
import OutputNode from '../models/OutputNode';

const props = defineProps({
    node: {
        type: OutputNode,
        required: true,
    },
})

</script>

<template>
    <VNodeRow :input-port="props.node.inputs[0]">
        <div class="p-4">
            Value: {{ props.node.inputs[0].value }}
        </div>
    </VNodeRow>
</template>