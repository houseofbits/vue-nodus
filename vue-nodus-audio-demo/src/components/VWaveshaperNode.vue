<script setup lang="ts">
import { VNodeRow } from '@houseofbits/vue-nodus'
import WaveshaperControlNode from '../models/WaveshaperControlNode'

const props = defineProps({
    node: {
        type: WaveshaperControlNode,
        required: true,
    },
})
</script>

<template>
    <div class="py-2.5 text-xs text-gray-600">
        <VNodeRow :input-port="props.node.inputs[0]" :output-port="props.node.outputs[0]">
            <div class="px-4 pb-2 flex flex-col gap-2">
                <label class="flex flex-col gap-1">
                    <span class="flex justify-between">
                        <span>Drive</span>
                        <span>{{ props.node.state.drive.toFixed(2) }}</span>
                    </span>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        class="w-full accent-emerald-400"
                        v-model.number="props.node.state.drive"
                        @input="props.node.applyParams()"
                    />
                </label>
                <label class="flex flex-col gap-1">
                    <span class="flex justify-between">
                        <span>Level</span>
                        <span>{{ props.node.state.level.toFixed(2) }}</span>
                    </span>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        class="w-full accent-emerald-400"
                        v-model.number="props.node.state.level"
                        @input="props.node.applyParams()"
                    />
                </label>
            </div>
        </VNodeRow>
    </div>
</template>
