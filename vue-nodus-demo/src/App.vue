<script setup lang="ts">
import { NodusBoard, VGraph } from '@houseofbits/vue-nodus'
import VConstantValueNode from './components/VConstantValueNode.vue';
import ConstantValueNode from './models/ConstantValueNode.ts';
import VOutputNode from './components/VOutputNode.vue';
import OutputNode from './models/OutputNode.ts';
import VMathNode from './components/VMathNode.vue';
import MultiplyValueNode from './models/MultiplyValueNode.ts';
import AddValueNode from './models/AddValueNode.ts';
import DivideValueNode from './models/DivideValueNode.ts';
import VNodeSelector from './components/VNodeSelector.vue';

const board = new NodusBoard();

board.registerComponent("ConstantValue", VConstantValueNode);
board.registerComponent("OutputValue", VOutputNode);
board.registerComponent("MathNode", VMathNode);

const registry: Record<string, new () => any> = {
  ConstantValueNode,
  OutputNode,
  MultiplyValueNode,
  AddValueNode,
  DivideValueNode,
};

const items = Object.keys(registry).map((key) => ({
  label: key,
  value: key,
}));

function create(name: string) {
  const Ctor = registry[name];
  if (!Ctor) throw new Error(`Unknown class: ${name}`);

  const node = new Ctor()

  const center = board.view.getBoardCenterPosition()
  node.setPosition(center.x, center.y)

  board.graph.addNode(node)
}

</script>

<template>
  <VGraph :board="board" />
  <VNodeSelector :items="items" class="command-button" @select="(item) => create(item.value)" />
</template>

<style>
.command-button {
  position: absolute;
  top: 8px;
  left: 8px;
}
</style>
