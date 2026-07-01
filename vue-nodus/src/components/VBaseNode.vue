<template>
    <div class="nodus-node" :class="{ 'nodus-selected': isSelected }">
        <div class="nodus-title-bar">
            <slot name="title">{{ node.internalState.title }}</slot>
        </div>

        <div class="nodus-window-content">
            <slot name="content" />
        </div>

        <template v-if="props.node.isPortAutoLayoutEnabled">
            <div v-if="props.node.inputs.length > 0" class="inputs" :style="nodeHeight">
                <VPort v-for="port in props.node.inputs" :key="port.id" :port="port"></VPort>
            </div>
            <div v-if="props.node.outputs.length > 0" class="outputs" :style="nodeHeight">
                <VPort v-for="port in props.node.outputs" :key="port.id" :port="port"></VPort>
            </div>
        </template>
    </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import NodusBaseNode from '../models/BaseNode.js'
import VPort from './VPort.vue'

const props = defineProps({
    node: {
        type: NodusBaseNode,
        required: true,
    },
    isSelected: {
        type: Boolean,
        default: false
    },
})

const nodeHeight = computed(() => {
    return {
        height: props.node.internalState.height + 'px'
    }
});

</script>

<style scoped>
.nodus-node {
    position: absolute;
    width: auto;
    height: auto;
    display: flex;
    flex-direction: column;
    border-radius: var(--nodus-node-border-radius, 8px);
    box-shadow: var(--nodus-node-shadow, 0 6px 15px rgba(0, 0, 0, 0.2));
    transition: border 100ms linear;
    overflow: visible;
}

.nodus-selected {
    outline: var(--nodus-node-selection-width, 4px) solid var(--nodus-node-selection-color, rgba(255, 255, 255, 1));
    outline-offset: 0;
}

.nodus-title-bar {
    height: auto;
    background: var(--nodus-node-title-bg, linear-gradient(14deg, rgba(0, 132, 184, 1) 0%, rgba(91, 176, 175, 1) 100%));
    color: var(--nodus-node-title-color, white);
    padding: 8px;
    padding-top: 4px;
    padding-bottom: 4px;
    font-weight: 600;
    font-size: 14px;
    flex-shrink: 0;
    border-bottom: 1px solid var(--nodus-node-title-bottom-border, #005a9e);
    user-select: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top-left-radius: var(--nodus-node-border-radius, 8px);
    border-top-right-radius: var(--nodus-node-border-radius, 8px);
    border-top: 1px solid var(--nodus-node-title-border-color, #82c2ff);
    border-left: 1px solid var(--nodus-node-title-border-color, #82c2ff);
    border-right: 1px solid var(--nodus-node-title-border-color, #82c2ff);
    cursor: grab;
    overflow: hidden;
}

.nodus-window-content {
    flex: 1;
    background-color: var(--nodus-node-content-bg, #cfcfcf);
    overflow: visible;
    border-bottom: 1px solid var(--nodus-node-content-border-color, #ffffff);
    border-left: 1px solid var(--nodus-node-content-border-color, #ffffff);
    border-right: 1px solid var(--nodus-node-content-border-color, #ffffff);
    border-bottom-left-radius: var(--nodus-node-border-radius, 8px);
    border-bottom-right-radius: var(--nodus-node-border-radius, 8px);
    min-width: 30px;
    min-height: 30px;
}

.inputs {
    height: 100%;
    width: calc(var(--nodus-port-size, 20px) * 2);
    position: absolute;
    bottom: 0;
    left: calc(var(--nodus-port-size, 20px) * -1);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-around;
}

.outputs {
    height: 100%;
    width: calc(var(--nodus-port-size, 20px) * 2);
    position: absolute;
    bottom: 0;
    right: calc(var(--nodus-port-size, 20px) * -1);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-around;
    cursor: pointer;
}
</style>