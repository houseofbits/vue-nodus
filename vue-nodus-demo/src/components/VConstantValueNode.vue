<script setup lang="ts">
import { VNodeRow } from '@houseofbits/vue-nodus'
import ConstantValueNode from '../models/ConstantValueNode';

const props = defineProps({
    node: {
        type: ConstantValueNode,
        required: true,
    },
})

</script>

<template>
    <VNodeRow :output-port="props.node.outputs[0]">
        <div class="p-4">
            <input
                class="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-md bg-white text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/30 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                type="number"
                v-model="props.node.state.value"
                @input="node.compute()"
            />
        </div>
    </VNodeRow>
</template>