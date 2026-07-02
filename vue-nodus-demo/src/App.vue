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
import MinValueNode from './models/MinValueNode.ts';
import MaxValueNode from './models/MaxValueNode.ts';
import VClampNode from './components/VClampNode.vue';
import ClampValueNode from './models/ClampValueNode.ts';
import VConditionNode from './components/VConditionNode.vue';
import ConditionValueNode from './models/ConditionValueNode.ts';
import VNodeSelector from './components/VNodeSelector.vue';
import { populateRpgDamageCalculator } from './demos/rpgDamageCalculator.ts';

const board = new NodusBoard();

board.registerComponent("ConstantValue", VConstantValueNode);
board.registerComponent("OutputValue", VOutputNode);
board.registerComponent("MathNode", VMathNode);
board.registerComponent("ClampNode", VClampNode);
board.registerComponent("ConditionNode", VConditionNode);

populateRpgDamageCalculator(board);

const registry: Record<string, new () => any> = {
  ConstantValueNode,
  OutputNode,
  MultiplyValueNode,
  AddValueNode,
  DivideValueNode,
  MinValueNode,
  MaxValueNode,
  ClampValueNode,
  ConditionValueNode,
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
  <VNodeSelector :items="items" class="absolute top-2 left-2" @select="(item) => create(item.value)" />
</template>
