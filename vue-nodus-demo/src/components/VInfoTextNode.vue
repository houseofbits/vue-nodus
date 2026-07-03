<script setup lang="ts">
import { NodusBaseNode, NodusBoard } from '@houseofbits/vue-nodus'
import { inject } from 'vue'

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


const board = inject<NodusBoard>('board')
if (!board) throw new Error('VBaseNode must be used inside VGraph')

function onDelete() {
    board?.view.deleteNode(props.node)
}

</script>

<template>
    <div class="nodus-node" :class="{ 'nodus-selected': isSelected }">
        <div class="nodus-title-bar nodus-drag-handle">
            <slot name="title">{{ node.internalState.title }}</slot>
            <button v-if="isSelected" type="button" class="nodus-delete-btn"
                aria-label="Delete node" @pointerdown.stop @click.stop="onDelete">&times;</button>
        </div>

        <div class="nodus-window-content">
            
        </div>
    </div>
</template>

