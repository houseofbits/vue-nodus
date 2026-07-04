<script setup lang="ts">
import { NodusBoard } from '@houseofbits/vue-nodus'
import { inject } from 'vue'
import InfoTextNode from '../models/InfoTextNode'

const props = defineProps({
    node: {
        type: InfoTextNode,
        required: true,
    },
    isSelected: {
        type: Boolean,
        default: false
    },
})

const board = inject<NodusBoard>('board')
if (!board) throw new Error('VInfoTextNode must be used inside VGraph')

function onDelete() {
    board?.view.deleteNode(props.node)
}
</script>

<template>
    <div class="info-node nodus-node" :class="{ 'info-selected': isSelected }">
        <div class="info-title-bar nodus-drag-handle">
            <span v-if="!isSelected" class="info-title-text">{{ node.internalState.title }}</span>
            <input v-else v-model="node.internalState.title" type="text" class="info-title-input"
                aria-label="Node title" @pointerdown.stop />

            <button v-if="isSelected" type="button" class="info-delete-btn" aria-label="Delete node"
                @pointerdown.stop @click.stop="onDelete">&times;</button>
        </div>

        <div class="info-content">
            <p v-if="!isSelected" class="info-text">{{ node.state.text }}</p>
            <textarea v-else v-model="node.state.text" class="info-textarea" rows="4"
                placeholder="Enter text..." @pointerdown.stop></textarea>
        </div>
    </div>
</template>

<style scoped>
.info-node {
    position: absolute;
    display: flex;
    flex-direction: column;
    background: transparent;
    border: none;
    box-shadow: none;
    padding: 4px;
    border-radius: 4px;
}

.info-selected {
    outline: 1px dashed rgba(255, 255, 255, 0.6);
    outline-offset: 4px;
}

.info-title-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    cursor: grab;
    user-select: none;
}

.info-title-text {
    color: #ffffff;
    font-weight: 700;
    font-size: 14px;
}

.info-title-input {
    flex: 1;
    color: #ffffff;
    font-weight: 700;
    font-size: 14px;
    background: transparent;
    border: none;
    outline: none;
    font-family: inherit;
    padding: 0;
}

.info-delete-btn {
    flex-shrink: 0;
    background: transparent;
    border: none;
    color: #ffffff;
    font-size: 20px;
    line-height: 1;
    padding: 0;
    cursor: pointer;
}

.info-content {
    margin-top: 4px;
}

.info-text {
    color: #ffffff;
    font-size: 14px;
    white-space: pre-wrap;
    margin: 0;
}

.info-textarea {
    width: 100%;
    color: #ffffff;
    font-size: 14px;
    background: transparent;
    border: none;
    outline: none;
    resize: vertical;
    font-family: inherit;
    padding: 0;
}

.info-textarea::placeholder {
    color: rgba(255, 255, 255, 0.5);
}
</style>
