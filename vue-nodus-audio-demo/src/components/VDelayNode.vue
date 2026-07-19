<script setup lang="ts">
import { VNodeRow } from '@houseofbits/vue-nodus'
import DelayControlNode from '../models/DelayControlNode'

const props = defineProps({
    node: {
        type: DelayControlNode,
        required: true,
    },
})
</script>

<template>
    <div class="py-2.5 text-xs text-gray-600">
        <VNodeRow :input-port="props.node.inputs[0]" :output-port="props.node.outputs[0]">
            <div class="px-4 flex flex-col gap-2">
                <label class="flex flex-col gap-1" :class="{ 'opacity-50': props.node.isClockSynced }">
                    <span class="flex justify-between">
                        <span>Time</span>
                        <span>{{ props.node.state.time.toFixed(2) }} s</span>
                    </span>
                    <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.01"
                        class="w-full accent-emerald-400"
                        :disabled="props.node.isClockSynced"
                        v-model.number="props.node.state.time"
                        @input="props.node.applyParams()"
                    />
                </label>
                <label class="flex flex-col gap-1">
                    <span class="flex justify-between">
                        <span>Feedback</span>
                        <span>{{ props.node.state.feedback.toFixed(2) }}</span>
                    </span>
                    <input
                        type="range"
                        min="0"
                        max="0.9"
                        step="0.01"
                        class="w-full accent-emerald-400"
                        v-model.number="props.node.state.feedback"
                        @input="props.node.applyParams()"
                    />
                </label>
            </div>
        </VNodeRow>
        <VNodeRow :input-port="props.node.inputs[1]">
            <div class="px-4 py-1 text-black italic">sync in</div>
        </VNodeRow>
    </div>
</template>
