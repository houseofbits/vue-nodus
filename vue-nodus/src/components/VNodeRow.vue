<template>
    <div class="node-row">
        <slot />

        <div v-if="props.inputPort" class="input-port">
            <VPort :key="props.inputPort.id" :port="props.inputPort" />
        </div>
        <div v-if="props.outputPort" class="output-port">
            <VPort :key="props.outputPort.id" :port="props.outputPort" />
        </div>
    </div>
</template>

<script lang="ts" setup>
import { NodusPort } from '../models'
import VPort from './VPort.vue'

const props = defineProps({
    inputPort: {
        type: NodusPort,
        required: false,
        default: undefined,
    },
    outputPort: {
        type: NodusPort,
        required: false,
        default: undefined,
    },
})
</script>

<style scoped>
.node-row {
    width: 100%;
    /* 100% (not auto) so content can fill a resizable node's explicit height; a no-op
       for auto-sized nodes since a percentage against an indeterminate ancestor height
       resolves to auto anyway. */
    height: 100%;
    position: relative;
}

.input-port {
    position: absolute;
    top: 0;
    bottom: 0;
    left: -12px;
    width: auto;
    display: flex;
    justify-content: center;
    align-items: center;
}

.output-port {
    position: absolute;
    top: 0;
    bottom: 0;
    right: -12px;
    width: auto;
    display: flex;
    justify-content: center;
    align-items: center;
}
</style>
