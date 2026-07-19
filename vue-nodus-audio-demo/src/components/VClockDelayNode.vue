<script setup lang="ts">
import { VNodeRow } from '@houseofbits/vue-nodus'
import ClockDelayNode from '../models/ClockDelayNode'

const props = defineProps({
    node: {
        type: ClockDelayNode,
        required: true,
    },
})
</script>

<template>
    <div class="py-2.5 text-xs text-gray-600">
        <VNodeRow :input-port="props.node.inputs[0]">
            <div class="px-4 py-1 text-black italic">clock in</div>
        </VNodeRow>

        <div class="px-4 py-2">
            <label class="flex flex-col gap-1">
                <span class="flex justify-between">
                    <span>Delay</span>
                    <span>{{ (props.node.state.delayTime * 1000).toFixed(0) }} ms</span>
                </span>
                <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.01"
                    class="w-full accent-sky-400"
                    v-model.number="props.node.state.delayTime"
                />
            </label>
        </div>

        <VNodeRow :output-port="props.node.outputs[0]">
            <div class="px-4 py-1 text-right text-black italic">clock out</div>
        </VNodeRow>
    </div>
</template>
