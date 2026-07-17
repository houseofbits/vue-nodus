<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { VNodeRow } from '@houseofbits/vue-nodus'
import AnalyserDisplayNode from '../models/AnalyserDisplayNode'

const props = defineProps({
    node: {
        type: AnalyserDisplayNode,
        required: true,
    },
})

const canvas = ref<HTMLCanvasElement | null>(null)
const buffer = new Uint8Array(props.node.analyser.fftSize)
let rafId = 0

function draw() {
    const el = canvas.value
    if (el) {
        const ctx = el.getContext('2d')
        if (ctx) {
            props.node.analyser.getByteTimeDomainData(buffer)

            ctx.fillStyle = '#111827'
            ctx.fillRect(0, 0, el.width, el.height)

            ctx.strokeStyle = '#34d399'
            ctx.lineWidth = 1.5
            ctx.beginPath()
            const step = el.width / buffer.length
            for (let i = 0; i < buffer.length; i++) {
                const y = (buffer[i] / 255) * el.height
                if (i === 0) ctx.moveTo(0, y)
                else ctx.lineTo(i * step, y)
            }
            ctx.stroke()
        }
    }
    rafId = requestAnimationFrame(draw)
}

onMounted(() => {
    rafId = requestAnimationFrame(draw)
})

onUnmounted(() => {
    cancelAnimationFrame(rafId)
})
</script>

<template>
    <div class="py-2.5">
        <VNodeRow :input-port="props.node.inputs[0]" :output-port="props.node.outputs[0]">
            <div class="px-4">
                <canvas ref="canvas" width="288" height="120" class="w-full rounded"></canvas>
            </div>
        </VNodeRow>
    </div>
</template>
