<script setup lang="ts">
import { VNodeRow } from '@houseofbits/vue-nodus'
import StepSequencerNode from '../models/StepSequencerNode'

const props = defineProps({
    node: {
        type: StepSequencerNode,
        required: true,
    },
})

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

// C2 (MIDI 36) up to C5 (MIDI 72)
const noteOptions = Array.from({ length: 37 }, (_, i) => {
    const midi = 36 + i
    return {
        value: midi,
        label: `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`,
    }
})
</script>

<template>
    <div class="py-2.5 text-xs text-gray-600">
        <div class="px-4 pb-2 grid grid-cols-2 gap-x-4 gap-y-1">
            <label class="flex flex-col">
                <span class="flex justify-between">
                    <span>BPM</span>
                    <span>{{ props.node.state.bpm }}</span>
                </span>
                <input
                    type="range"
                    min="60"
                    max="200"
                    step="1"
                    class="w-full accent-emerald-400"
                    v-model.number="props.node.state.bpm"
                />
            </label>
            <label class="flex flex-col">
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
                />
            </label>
            <label class="flex flex-col">
                <span class="flex justify-between">
                    <span>Gate</span>
                    <span>{{ props.node.state.gateLength.toFixed(2) }}</span>
                </span>
                <input
                    type="range"
                    min="0.05"
                    max="0.95"
                    step="0.01"
                    class="w-full accent-emerald-400"
                    v-model.number="props.node.state.gateLength"
                />
            </label>
            <label class="flex flex-col">
                <span class="flex justify-between">
                    <span>Attack / Release</span>
                    <span>{{ (props.node.state.attack * 1000).toFixed(0) }} / {{ (props.node.state.release * 1000).toFixed(0) }} ms</span>
                </span>
                <span class="flex gap-2">
                    <input
                        type="range"
                        min="0"
                        max="0.2"
                        step="0.001"
                        class="w-full accent-emerald-400"
                        v-model.number="props.node.state.attack"
                    />
                    <input
                        type="range"
                        min="0.02"
                        max="1"
                        step="0.01"
                        class="w-full accent-emerald-400"
                        v-model.number="props.node.state.release"
                    />
                </span>
            </label>
        </div>

        <div class="px-4 pb-2 grid grid-cols-8 gap-1">
            <div
                v-for="(step, i) in props.node.state.steps"
                :key="i"
                class="flex flex-col items-center gap-1 rounded p-1 transition-colors"
                :class="props.node.state.currentStep === i ? 'bg-emerald-200' : 'bg-gray-200/60'"
            >
                <input type="checkbox" class="accent-emerald-500" v-model="step.on" />
                <select
                    class="w-full px-0.5 py-0.5 text-[10px] border border-gray-300 rounded bg-white text-gray-900 outline-none"
                    v-model.number="step.note"
                >
                    <option v-for="opt in noteOptions" :key="opt.value" :value="opt.value">
                        {{ opt.label }}
                    </option>
                </select>
            </div>
        </div>

        <VNodeRow :output-port="props.node.outputs[0]">
            <div class="px-4 py-1 text-right text-black italic">pitch out</div>
        </VNodeRow>
        <VNodeRow :output-port="props.node.outputs[1]">
            <div class="px-4 py-1 text-right text-black italic">gate out</div>
        </VNodeRow>
    </div>
</template>
