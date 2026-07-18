<script setup lang="ts">
import { VNodeRow } from '@houseofbits/vue-nodus'
import CompressorControlNode from '../models/CompressorControlNode'

const props = defineProps({
    node: {
        type: CompressorControlNode,
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
                        <span>Threshold</span>
                        <span>{{ props.node.state.threshold.toFixed(0) }} dB</span>
                    </span>
                    <input
                        type="range"
                        min="-100"
                        max="0"
                        step="1"
                        class="w-full accent-emerald-400"
                        v-model.number="props.node.state.threshold"
                        @input="props.node.applyParams()"
                    />
                </label>
                <label class="flex flex-col gap-1">
                    <span class="flex justify-between">
                        <span>Knee</span>
                        <span>{{ props.node.state.knee.toFixed(0) }}</span>
                    </span>
                    <input
                        type="range"
                        min="0"
                        max="40"
                        step="1"
                        class="w-full accent-emerald-400"
                        v-model.number="props.node.state.knee"
                        @input="props.node.applyParams()"
                    />
                </label>
                <label class="flex flex-col gap-1">
                    <span class="flex justify-between">
                        <span>Ratio</span>
                        <span>{{ props.node.state.ratio.toFixed(0) }}:1</span>
                    </span>
                    <input
                        type="range"
                        min="1"
                        max="20"
                        step="1"
                        class="w-full accent-emerald-400"
                        v-model.number="props.node.state.ratio"
                        @input="props.node.applyParams()"
                    />
                </label>
                <label class="flex flex-col gap-1">
                    <span class="flex justify-between">
                        <span>Attack</span>
                        <span>{{ props.node.state.attack.toFixed(3) }} s</span>
                    </span>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.001"
                        class="w-full accent-emerald-400"
                        v-model.number="props.node.state.attack"
                        @input="props.node.applyParams()"
                    />
                </label>
                <label class="flex flex-col gap-1">
                    <span class="flex justify-between">
                        <span>Release</span>
                        <span>{{ props.node.state.release.toFixed(2) }} s</span>
                    </span>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        class="w-full accent-emerald-400"
                        v-model.number="props.node.state.release"
                        @input="props.node.applyParams()"
                    />
                </label>
            </div>
        </VNodeRow>
    </div>
</template>
