<script setup lang="ts">
import { computed } from 'vue'
import { VNodeRow } from '@houseofbits/vue-nodus'
import OscillatorSourceNode from '../models/OscillatorSourceNode'

const props = defineProps({
    node: {
        type: OscillatorSourceNode,
        required: true,
    },
})

const FREQ_MIN = 20
const FREQ_MAX = 2000

const freqSlider = computed({
    // Clamped so out-of-slider-range values (e.g. frequency 0 when a
    // sequencer drives the pitch) don't produce -Infinity.
    get: () =>
        Math.min(
            1,
            Math.max(0, Math.log(props.node.state.frequency / FREQ_MIN) / Math.log(FREQ_MAX / FREQ_MIN)),
        ),
    set: (t: number) => {
        props.node.state.frequency = Math.round(FREQ_MIN * Math.pow(FREQ_MAX / FREQ_MIN, t))
        props.node.applyParams()
    },
})
</script>

<template>
    <div class="py-2.5 text-xs text-gray-600">
        <VNodeRow :output-port="props.node.outputs[0]">
            <div class="px-4 pb-2 flex flex-col gap-2">
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
                        <span>Frequency</span>
                        <span>{{ props.node.state.frequency }} Hz</span>
                    </span>
                    <input type="range" min="0" max="1" step="0.001" class="w-full accent-emerald-400" v-model.number="freqSlider" />
                </label>
                <label class="flex flex-col gap-1">
                    <span class="flex justify-between">
                        <span>Detune</span>
                        <span>{{ props.node.state.detune }} ct</span>
                    </span>
                    <input
                        type="range"
                        min="-100"
                        max="100"
                        step="1"
                        class="w-full accent-emerald-400"
                        v-model.number="props.node.state.detune"
                        @input="props.node.applyParams()"
                    />
                </label>
            </div>
        </VNodeRow>
        <VNodeRow :input-port="props.node.inputs[0]">
            <div class="px-4 py-1 text-black italic">freq mod</div>
        </VNodeRow>
        <VNodeRow :input-port="props.node.inputs[1]">
            <div class="px-4 py-1 text-black italic">reset in</div>
        </VNodeRow>
    </div>
</template>
