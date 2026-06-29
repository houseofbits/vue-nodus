<template>
    <div class="node-row">
        <slot />

        <div class="input-port" v-if="props.inputPort">
            <VPort :port="props.inputPort"/>
        </div>
        <div class="output-port" v-if="props.outputPort">
            <VPort :port="props.outputPort"/>
        </div>
    </div>
</template>

<script lang="ts" setup>

import { Port } from '../models';
import VPort from './VPort.vue';

const props = defineProps({
    inputPort: {
        type: Port,
        required: false,
    },
    outputPort: {
        type: Port,
        required: false,
    }    
});

</script>

<style scoped>
    .node-row {
        width:100%;
        height:auto;
        position:relative;
    }

    .input-port {
        position: absolute;
        top:0;
        bottom:0;
        left:-12px;
        width:auto;
        display: flex;
        justify-content: center;
        align-items: center;        
    }

    .output-port {
        position: absolute;
        top:0;
        bottom:0;
        right:-12px;
        width:auto;
        display: flex;
        justify-content: center;
        align-items: center;        
    }
</style>