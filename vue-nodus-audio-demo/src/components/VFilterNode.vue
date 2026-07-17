<script setup lang="ts">
import { computed } from 'vue'
import { VNodeRow } from '@houseofbits/vue-nodus'
import BiquadFilterControlNode from '../models/BiquadFilterControlNode'

const props = defineProps({
    node: {
        type: BiquadFilterControlNode,
        required: true,
    },
})

const FREQ_MIN = 40
const FREQ_MAX = 12000

const freqSlider = computed({
    get: () => Math.log(props.node.state.frequency / FREQ_MIN) / Math.log(FREQ_MAX / FREQ_MIN),
    set: (t: number) => {
        props.node.state.frequency = Math.round(FREQ_MIN * Math.pow(FREQ_MAX / FREQ_MIN, t))
        props.node.applyParams()
    },
})
</script>

<template>
    <div class="py-2.5 text-xs text-gray-600">
        <VNodeRow :input-port="props.node.inputs[0]" :output-port="props.node.outputs[0]">
            <div class="px-4 pb-2 flex flex-col gap-2">
                <label class="flex items-center justify-between gap-2">
                    Type
                    <select
                        class="px-1 py-0.5 border border-gray-300 rounded bg-white text-gray-900 outline-none"
                        v-model="props.node.state.type"
                        @change="props.node.applyParams()"
                    >
                        <option value="lowpass">Lowpass</option>
                        <option value="highpass">Highpass</option>
                        <option value="bandpass">Bandpass</option>
                        <option value="notch">Notch</option>
                        <option value="peaking">Peaking</option>
                    </select>
                </label>
                <label class="flex flex-col gap-1">
                    <span class="flex justify-between">
                        <span>Frequency</span>
                        <span>{{ props.node.state.frequency }} Hz</span>
                    </span>
                    <input type="range" min="0" max="1" step="0.001" class="w-full accent-emerald-400" v-model.number="freqSlider" />
                </label>
                <label class="flex flex-col gap-1">
                    <span class="flex justify-between">
                        <span>Q</span>
                        <span>{{ props.node.state.q.toFixed(1) }}</span>
                    </span>
                    <input
                        type="range"
                        min="0.1"
                        max="20"
                        step="0.1"
                        class="w-full accent-emerald-400"
                        v-model.number="props.node.state.q"
                        @input="props.node.applyParams()"
                    />
                </label>
            </div>
        </VNodeRow>
        <VNodeRow :input-port="props.node.inputs[1]">
            <div class="px-4 py-1 text-black italic">freq mod</div>
        </VNodeRow>
    </div>
</template>
