<script setup lang="ts">
import { VNodeRow } from '@houseofbits/vue-nodus'
import OutputNode from '../models/OutputNode';

const props = defineProps({
    node: {
        type: OutputNode,
        required: true,
    },
})

</script>

<template>
    <VNodeRow :input-port="props.node.inputs[0]">
        <div class="wrapper">
            Value: {{ props.node.inputs[0].value }}
        </div>
    </VNodeRow>
</template>


<style scoped>
.wrapper {
    padding: 16px;
}

.input {
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #111827;
  outline: none;
  transition: border 0.15s, box-shadow 0.15s;
}

.input::placeholder {
  color: #9ca3af;
}

.input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}

.input:disabled {
  background: #f3f4f6;
  color: #6b7280;
  cursor: not-allowed;
}
</style>