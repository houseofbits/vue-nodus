<script setup lang="ts">
import { VNodeRow } from '@houseofbits/vue-nodus'
import AudioOutputNode from '../models/AudioOutputNode'

const props = defineProps({
    node: {
        type: AudioOutputNode,
        required: true,
    },
})
</script>

<template>
    <div class="py-2.5 text-xs text-gray-600">
        <VNodeRow :input-port="props.node.inputs[0]">
            <div class="px-4">
                <label class="flex flex-col gap-1">
                    <span class="flex justify-between">
                        <span>Volume</span>
                        <span>{{ props.node.state.volume.toFixed(2) }}</span>
                    </span>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        class="w-full accent-emerald-400"
                        v-model.number="props.node.state.volume"
                        @input="props.node.applyParams()"
                    />
                </label>
            </div>
        </VNodeRow>
    </div>
</template>
