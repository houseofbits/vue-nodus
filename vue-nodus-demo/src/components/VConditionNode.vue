<script setup lang="ts">
import { VNodeRow } from '@houseofbits/vue-nodus'
import ConditionValueNode from '../models/ConditionValueNode';

const props = defineProps({
    node: {
        type: ConditionValueNode,
        required: true,
    },
})
</script>

<template>
    <div class="py-2.5">
        <div class="px-4 pb-2">
            <select
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 outline-none transition focus:border-blue-500 focus:ring-3 focus:ring-blue-500/30"
                v-model="props.node.state.operator"
                @change="node.compute()"
            >
                <option value="lt">A &lt; B</option>
                <option value="lte">A &lt;= B</option>
                <option value="gt">A &gt; B</option>
                <option value="gte">A &gt;= B</option>
                <option value="eq">A == B</option>
            </select>
        </div>
        <VNodeRow :input-port="props.node.inputs[0]">
            <div class="pl-4">A</div>
        </VNodeRow>
        <VNodeRow :input-port="props.node.inputs[1]">
            <div class="pl-4">B</div>
        </VNodeRow>
        <VNodeRow :output-port="props.node.outputs[0]">
            <div class="flex justify-end pr-4">out</div>
        </VNodeRow>
        <VNodeRow :input-port="props.node.inputs[2]">
            <div class="pl-4">then</div>
        </VNodeRow>
        <VNodeRow :input-port="props.node.inputs[3]">
            <div class="pl-4">else</div>
        </VNodeRow>
    </div>
</template>
