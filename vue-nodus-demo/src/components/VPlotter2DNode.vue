<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { VNodeRow } from '@houseofbits/vue-nodus'
import Plotter2DNode from '../models/Plotter2DNode'

const props = defineProps({
    node: {
        type: Plotter2DNode,
        required: true,
    },
})

onMounted(() => props.node.run())

function onSampleCountChange() {
    if (!props.node.state.isRunning) props.node.run()
}

const PLOT_SIZE = 100

const plotPoints = computed(() => {
    const samples = props.node.state.samples
    if (samples.length === 0) return []

    const ys = samples.map((s) => s.y)
    const minY = Math.min(0, ...ys)
    const maxY = Math.max(0, ...ys)
    const range = maxY - minY || 1

    return samples.map((s) => ({
        x: s.x * PLOT_SIZE,
        y: PLOT_SIZE - ((s.y - minY) / range) * PLOT_SIZE,
    }))
})

const polylinePoints = computed(() => plotPoints.value.map((p) => `${p.x},${p.y}`).join(' '))

const baselineY = computed(() => {
    const samples = props.node.state.samples
    const ys = samples.map((s) => s.y)
    const minY = Math.min(0, ...ys)
    const maxY = Math.max(0, ...ys)
    const range = maxY - minY || 1
    return PLOT_SIZE - ((0 - minY) / range) * PLOT_SIZE
})
</script>

<template>
    <div class="py-2.5">
        <VNodeRow :input-port="props.node.inputs[0]" :output-port="props.node.outputs[0]">
            <div class="flex justify-between items-center pr-4 pl-4 gap-3">
                <div>y</div>
                <div class="flex-1 flex flex-col items-center gap-2">
                    <label class="flex items-center gap-2 text-xs text-gray-300">
                        Samples
                        <input
                            type="number"
                            min="2"
                            step="1"
                            class="w-16 px-1 py-0.5 text-xs border border-gray-300 rounded bg-white text-gray-900 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                            v-model.number="props.node.state.sampleCount"
                            :disabled="props.node.state.isRunning"
                            @change="onSampleCountChange"
                        />
                    </label>
                    <svg
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        class="w-full h-72 rounded"
                    >
                        <line x1="0" :y1="baselineY" x2="100" :y2="baselineY" stroke="#4b5563" stroke-width="0.5" vector-effect="non-scaling-stroke" />
                        <polyline
                            :points="polylinePoints"
                            fill="none"
                            stroke="#4f6ff7"
                            stroke-width="1.5"
                            vector-effect="non-scaling-stroke"
                        />
                    </svg>
                    <button
                        v-if="props.node.state.isRunning"
                        type="button"
                        class="px-3 py-1 text-xs rounded text-white bg-red-600"
                        @click="props.node.stop()"
                    >
                        Stop
                    </button>
                </div>
                <div>x</div>
            </div>
        </VNodeRow>
    </div>
</template>
