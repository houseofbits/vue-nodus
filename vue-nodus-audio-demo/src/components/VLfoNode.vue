<script setup lang="ts">
import { VNodeRow } from '@houseofbits/vue-nodus'
import LfoSourceNode from '../models/LfoSourceNode'

const props = defineProps({
    node: {
        type: LfoSourceNode,
        required: true,
    },
})
</script>

<template>
    <div class="py-2.5 text-xs text-gray-600">
        <VNodeRow :input-port="props.node.inputs[0]">
            <div class="px-4 py-1 text-black italic">reset in</div>
        </VNodeRow>
        <VNodeRow :output-port="props.node.outputs[0]">
            <div class="px-4 flex flex-col gap-2">
                <label class="flex items-center justify-between gap-2">
                    Wave
                    <select
                        class="px-1 py-0.5 border border-gray-300 rounded bg-white text-gray-900 outline-none"
                        v-model="props.node.state.waveform"
                        @change="props.node.applyParams()"
                    >
                        <option value="sine">Sine</option>
                        <option value="square">Square</option>
                        <option value="sawtooth">Sawtooth</option>
                        <option value="triangle">Triangle</option>
                    </select>
                </label>
                <label class="flex flex-col gap-1">
                    <span class="flex justify-between">
                        <span>Rate</span>
                        <span>{{ props.node.state.rate }} Hz</span>
                    </span>
                    <input
                        type="range"
                        min="0.1"
                        max="20"
                        step="0.1"
                        class="w-full accent-amber-400"
                        v-model.number="props.node.state.rate"
                        @input="props.node.applyParams()"
                    />
                </label>
                <label class="flex flex-col gap-1">
                    <span class="flex justify-between">
                        <span>Depth</span>
                        <span>±{{ props.node.state.depth }}</span>
                    </span>
                    <input
                        type="range"
                        min="0"
                        max="1000"
                        step="1"
                        class="w-full accent-amber-400"
                        v-model.number="props.node.state.depth"
                        @input="props.node.applyParams()"
                    />
                </label>
            </div>
        </VNodeRow>
    </div>
</template>
