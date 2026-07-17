<script setup lang="ts">
import { VNodeRow } from '@houseofbits/vue-nodus'
import MixerControlNode from '../models/MixerControlNode'

const props = defineProps({
    node: {
        type: MixerControlNode,
        required: true,
    },
})

function panLabel(pan: number): string {
    if (Math.abs(pan) < 0.05) return 'C'
    const side = pan < 0 ? 'L' : 'R'
    return `${Math.round(Math.abs(pan) * 100)}${side}`
}
</script>

<template>
    <div class="py-2.5 text-xs text-gray-600">
        <VNodeRow
            v-for="(channel, i) in props.node.state.channels"
            :key="i"
            :input-port="props.node.inputs[i]"
            :output-port="i === 0 ? props.node.outputs[0] : undefined"
        >
            <div class="px-4 pb-2 flex items-center gap-3">
                <span class="font-medium">Ch {{ i + 1 }}</span>
                <label class="flex-1 flex flex-col">
                    <span class="flex justify-between">
                        <span>Level</span>
                        <span>{{ channel.level.toFixed(2) }}</span>
                    </span>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        class="w-full accent-emerald-400"
                        v-model.number="channel.level"
                        @input="props.node.applyParams()"
                    />
                </label>
                <label class="flex-1 flex flex-col">
                    <span class="flex justify-between">
                        <span>Pan</span>
                        <span>{{ panLabel(channel.pan) }}</span>
                    </span>
                    <input
                        type="range"
                        min="-1"
                        max="1"
                        step="0.01"
                        class="w-full accent-emerald-400"
                        v-model.number="channel.pan"
                        @input="props.node.applyParams()"
                    />
                </label>
            </div>
        </VNodeRow>
    </div>
</template>
