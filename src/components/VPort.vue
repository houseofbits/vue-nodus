<template>
    <div :style="style" :class="['port', { 'port--inactive': isInactive }]" ref="portEl" @mousedown.stop.prevent="board.graph.selectPort(props.port)" />
</template>

<script lang="ts" setup>

import { ref, onMounted, onUnmounted, inject, computed } from 'vue'
import { NodusBoard, NodusPort } from '../models';

const board = inject<NodusBoard>('board')
if (!board) throw new Error('VPort must be used inside VGraph')

const props = defineProps({
    port: {
        type: NodusPort,
        required: true,
    }
});

const portEl = ref<HTMLElement>()
let observer: ResizeObserver | null = null

onMounted(() => {
    if (portEl.value === undefined) {
        return
    }
    board.view.portRegistry.register(props.port.id, portEl.value);

    observer = new ResizeObserver(() => {
        board.view.portRegistry.update(
            props.port.id
        )
    })

    observer.observe(portEl.value)
})

onUnmounted(() => {
    observer?.disconnect()

    board.view.portRegistry.unregister(props.port.id);

});

const style = computed(() => {
    return {
        'background-color': props.port.color,
    }
})

const isInactive = computed(() => {
    const selected = board.graph.selectedPort.value
    if (!selected) return false
    if (selected.id === props.port.id) return false
    return selected.ioType === props.port.ioType || selected.type !== props.port.type
})

</script>

<style scoped>
.port {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    /* border: 1px solid white; */
    background-color: white;
}

.port:not(.port--inactive):hover {
    outline: 3px solid rgba(255, 255, 255, 1);
    outline-offset: 0;
    cursor: pointer;
}

.port--inactive {
    opacity: 0.25;
    cursor: not-allowed;
}
</style>