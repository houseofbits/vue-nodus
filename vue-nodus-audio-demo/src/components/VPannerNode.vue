<script setup lang="ts">
import { VNodeRow } from '@houseofbits/vue-nodus'
import PannerControlNode from '../models/PannerControlNode'

const props = defineProps({
    node: {
        type: PannerControlNode,
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
        <VNodeRow :input-port="props.node.inputs[0]" :output-port="props.node.outputs[0]">
            <div class="px-4 pb-2">
                <label class="flex flex-col gap-1">
                    <span class="flex justify-between">
                        <span>Pan</span>
                        <span>{{ panLabel(props.node.state.pan) }}</span>
                    </span>
                    <input
                        type="range"
                        min="-1"
                        max="1"
                        step="0.01"
                        class="w-full accent-emerald-400"
                        v-model.number="props.node.state.pan"
                        @input="props.node.applyParams()"
                    />
                </label>
            </div>
        </VNodeRow>
        <VNodeRow :input-port="props.node.inputs[1]">
            <div class="px-4 py-1 text-black italic">pan mod</div>
        </VNodeRow>
    </div>
</template>
