<script setup lang="ts">
import { VNodeRow } from '@houseofbits/vue-nodus'
import BlendControlNode from '../models/BlendControlNode'

const props = defineProps({
    node: {
        type: BlendControlNode,
        required: true,
    },
})
</script>

<template>
    <div class="py-2.5 text-xs text-gray-600">
        <VNodeRow :input-port="props.node.inputs[0]" :output-port="props.node.outputs[0]">
            <div class="px-4 py-1 text-black italic">A</div>
        </VNodeRow>
        <VNodeRow :input-port="props.node.inputs[1]">
            <div class="px-4 pb-2 flex flex-col gap-2">
                <div class="italic text-black">B</div>
                <label class="flex flex-col gap-1">
                    <span class="flex justify-between">
                        <span>Blend</span>
                        <span>{{ props.node.state.blend.toFixed(2) }}</span>
                    </span>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        class="w-full accent-emerald-400"
                        v-model.number="props.node.state.blend"
                        @input="props.node.applyParams()"
                    />
                </label>
            </div>
        </VNodeRow>
    </div>
</template>
