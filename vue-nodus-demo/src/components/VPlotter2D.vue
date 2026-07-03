<script setup lang="ts">
import { NodusBaseNode, VNodeRow } from '@houseofbits/vue-nodus'

const props = defineProps({
    node: {
        type: NodusBaseNode,
        required: true,
    },
})
</script>

<template>
    <div class="py-2.5">
        <VNodeRow :input-port="props.node.inputs[0]" :output-port="props.node.outputs[0]">
            <div class="flex justify-between items-center pr-4 pl-4">
                <div>y</div>
                <div class="h-80">
                    <!-- implement svg graph curve here -->
                </div>
                <div>x</div>
            </div>
        </VNodeRow>
    </div>
</template>
