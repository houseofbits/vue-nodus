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
        // Keep the drawing buffer in sync with the rendered size (not just CSS) so resizing the
        // node doesn't stretch/blur the waveform. Resizing the buffer clears it, so this must
        // happen right before the redraw below rather than in a separate ResizeObserver callback -
        // otherwise the canvas briefly paints blank between the clear and the next animation
        // frame, which reads as a flicker during a drag.
        const width = Math.round(el.clientWidth)
        const height = Math.round(el.clientHeight)
        if (width > 0 && height > 0 && (el.width !== width || el.height !== height)) {
            el.width = width
            el.height = height
        }

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
    <div class="py-2.5 h-full">
        <VNodeRow :input-port="props.node.inputs[0]" :output-port="props.node.outputs[0]">
            <div class="px-4 h-full">
                <canvas ref="canvas" class="analyser-canvas rounded"></canvas>
            </div>
        </VNodeRow>
    </div>
</template>

<style scoped>
.analyser-canvas {
    display: block;
    width: 100%;
    height: 100%;
}
</style>
