<template>
    <div :style="style" class="port" ref="portEl" @click="board.graph.selectPort(props.port)" />
</template>

<script lang="ts" setup>

import { ref, onMounted, onUnmounted, inject, computed } from 'vue'
import { Board, Port } from '../models';

const board = inject<Board>('board')
if (!board) throw new Error('VPort must be used inside VGraph')

const props = defineProps({
    port: {
        type: Port,
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

</script>

<style scoped>
.port {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    /* border: 1px solid white; */
    background-color: white;
}

.port:hover {
    /* border-radius: 50%;
    border: 3px solid white; */
    outline: 3px solid rgba(255, 255, 255, 1);
    outline-offset: 0;
    cursor: pointer;
}
</style>