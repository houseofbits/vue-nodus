<template>
    <div class="node" :class="{ selected: isSelected }">
        <div class="title-bar">
            <slot name="title">{{ node.internalState.title }}</slot>
        </div>

        <div class="window-content">
            <slot name="content" />
        </div>

        <template v-if="props.node.isPortAutoLayoutEnabled">
            <div v-if="props.node.inputs.length > 0" class="inputs"
                :style="{ height: props.node.internalState.height }">
                <VPort v-for="port in props.node.inputs" :key="port.id" :port="port"></VPort>
            </div>
            <div v-if="props.node.outputs.length > 0" class="outputs"
                :style="{ height: props.node.internalState.height }">
                <VPort v-for="port in props.node.outputs" :key="port.id" :port="port"></VPort>
            </div>
        </template>
    </div>
</template>

<script lang="ts" setup>
import BaseNode from '../models/BaseNode.js';
import VNodeRow from './VNodeRow.vue';
import VPort from './VPort.vue'

const props = defineProps({
    node: {
        type: BaseNode,
        required: true,
    },
    isSelected: {
        type: Boolean,
        default: false
    },
})

</script>

<style scoped>
.node {
    position: absolute;
    width: 400px;
    height: 400px;
    display: flex;
    display: flex;
    flex-direction: column;
    border-radius: 12px;
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
    transition: border 100ms linear;
    overflow: visible;
}

.selected {
    outline: 4px solid rgba(255, 255, 255, 1);
    outline-offset: 0;
}

.title-bar {
    height: 18px;
    background: #0084b8;
    background: linear-gradient(14deg, rgba(0, 132, 184, 1) 0%, rgba(91, 176, 175, 1) 100%);
    color: white;
    padding: 8px 8px;
    font-weight: 600;
    font-size: 14px;
    flex-shrink: 0;
    border-bottom: 1px solid #005a9e;
    user-select: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
    border-top: 1px solid #82c2ff;
    border-left: 1px solid #82c2ff;
    border-right: 1px solid #82c2ff;
    cursor: grab;
    user-select: none;
    overflow: hidden;
}

.target-selected {
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: rgb(0, 0, 0);
    opacity: 0.5;
    border-radius: 12px;
}

.window-content {
    flex: 1;
    background-color: #cfcfcf;
    overflow: visible;
    border-bottom: 1px solid #ffffff;
    border-left: 1px solid #ffffff;
    border-right: 1px solid #ffffff;
    border-bottom-left-radius: 12px;
    border-bottom-right-radius: 12px;
}

.inputs {
    height: 100%;
    width: 40px;
    position: absolute;
    bottom: 0;
    left: -20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-around;
}

.outputs {
    height: 100%;
    width: 40px;
    position: absolute;
    bottom: 0;
    right: -20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-around;
    cursor: pointer;
}
</style>