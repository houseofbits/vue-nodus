<script setup lang="ts">
import { VNodeRow } from '@houseofbits/vue-nodus'
import EnvelopeControlNode from '../models/EnvelopeControlNode'

const props = defineProps({
    node: {
        type: EnvelopeControlNode,
        required: true,
    },
})
</script>

<template>
    <div class="py-2.5 text-xs text-gray-600">
        <VNodeRow :output-port="props.node.outputs[0]">
            <div class="px-4 pb-2 flex flex-col gap-2">
                <button
                    class="w-full py-2 rounded bg-emerald-400 text-white font-medium active:bg-emerald-600 select-none"
                    @mousedown="props.node.trigger()"
                    @mouseup="props.node.release()"
                    @mouseleave="props.node.release()"
                >
                    Trigger
                </button>
                <label class="flex flex-col gap-1">
                    <span class="flex justify-between">
                        <span>Attack</span>
                        <span>{{ props.node.state.attack.toFixed(2) }} s</span>
                    </span>
                    <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.01"
                        class="w-full accent-emerald-400"
                        v-model.number="props.node.state.attack"
                    />
                </label>
                <label class="flex flex-col gap-1">
                    <span class="flex justify-between">
                        <span>Decay</span>
                        <span>{{ props.node.state.decay.toFixed(2) }} s</span>
                    </span>
                    <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.01"
                        class="w-full accent-emerald-400"
                        v-model.number="props.node.state.decay"
                    />
                </label>
                <label class="flex flex-col gap-1">
                    <span class="flex justify-between">
                        <span>Sustain</span>
                        <span>{{ props.node.state.sustain.toFixed(2) }}</span>
                    </span>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        class="w-full accent-emerald-400"
                        v-model.number="props.node.state.sustain"
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
                        max="3"
                        step="0.01"
                        class="w-full accent-emerald-400"
                        v-model.number="props.node.state.release"
                    />
                </label>
            </div>
        </VNodeRow>
    </div>
</template>
