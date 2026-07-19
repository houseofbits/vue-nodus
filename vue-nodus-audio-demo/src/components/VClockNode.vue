<script setup lang="ts">
import { VNodeRow } from '@houseofbits/vue-nodus'
import ClockNode from '../models/ClockNode'

const props = defineProps({
    node: {
        type: ClockNode,
        required: true,
    },
})
</script>

<template>
    <div class="py-2.5 text-xs text-gray-600">
        <div class="px-4 pb-2 flex flex-col gap-2">
            <label class="flex flex-col gap-1">
                <span class="flex justify-between">
                    <span>BPM</span>
                    <span>{{ props.node.state.bpm }}</span>
                </span>
                <input
                    type="range"
                    min="60"
                    max="200"
                    step="1"
                    class="w-full accent-sky-400"
                    v-model.number="props.node.state.bpm"
                />
            </label>
            <label class="flex items-center justify-between gap-2">
                Division
                <select
                    class="px-1 py-0.5 border border-gray-300 rounded bg-white text-gray-900 outline-none"
                    v-model.number="props.node.state.division"
                >
                    <option :value="4">1/4</option>
                    <option :value="8">1/8</option>
                    <option :value="16">1/16</option>
                    <option :value="32">1/32</option>
                </select>
            </label>
        </div>

        <VNodeRow :output-port="props.node.outputs[0]">
            <div class="px-4 py-1 text-right text-black italic">clock out</div>
        </VNodeRow>
    </div>
</template>
