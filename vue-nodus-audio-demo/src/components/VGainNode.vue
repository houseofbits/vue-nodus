<script setup lang="ts">
import { VNodeRow } from '@houseofbits/vue-nodus'
import GainControlNode from '../models/GainControlNode'

const props = defineProps({
    node: {
        type: GainControlNode,
        required: true,
    },
})
</script>

<template>
    <div class="py-2.5 text-xs text-gray-600">
        <VNodeRow :input-port="props.node.inputs[0]" :output-port="props.node.outputs[0]">
            <div class="px-4 pb-2">
                <label class="flex flex-col gap-1">
                    <span class="flex justify-between">
                        <span>Gain</span>
                        <span>{{ props.node.state.gain.toFixed(2) }}</span>
                    </span>
                    <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.01"
                        class="w-full accent-emerald-400"
                        v-model.number="props.node.state.gain"
                        @input="props.node.applyParams()"
                    />
                </label>
            </div>
        </VNodeRow>
        <VNodeRow :input-port="props.node.inputs[1]">
            <div class="px-4 py-1 text-black italic">gain mod</div>
        </VNodeRow>
    </div>
</template>
