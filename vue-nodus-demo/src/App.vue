<script setup lang="ts">
import { NodusBoard, VGraph, NodusBaseNode } from '@houseofbits/vue-nodus'
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
import VUnaryMathNode from './components/VUnaryMathNode.vue';
import VPlotter2DNode from './components/VPlotter2DNode.vue';
import SinValueNode from './models/SinValueNode.ts';
import CosValueNode from './models/CosValueNode.ts';
import SquareValueNode from './models/SquareValueNode.ts';
import SqrtValueNode from './models/SqrtValueNode.ts';
import Plotter2DNode from './models/Plotter2DNode.ts';
import InfoTextNode from './models/InfoTextNode.ts';
import VNodeSelector from './components/VNodeSelector.vue';
import VInfoTextNode from './components/VInfoTextNode.vue';
import dampedSineWaveGraph from './demos/dampedSineWave.json'

const board = new NodusBoard();

board.registerComponent("ConstantValue", VConstantValueNode);
board.registerComponent("OutputValue", VOutputNode);
board.registerComponent("MathNode", VMathNode);
board.registerComponent("ClampNode", VClampNode);
board.registerComponent("ConditionNode", VConditionNode);
board.registerComponent("UnaryMathNode", VUnaryMathNode);
board.registerComponent("Plotter2DNode", VPlotter2DNode);
board.registerComponent("InfoTextNode", VInfoTextNode);

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
  SinValueNode,
  CosValueNode,
  SquareValueNode,
  SqrtValueNode,
  Plotter2DNode,
  InfoTextNode,
};

const items = Object.keys(registry).map((key) => ({
  label: key,
  value: key,
}));

function createNodeManually(nodeClass: string) {
  const NodeClass = registry[nodeClass]
  if (!NodeClass) throw new Error(`Unknown node class: ${nodeClass}`)

  const node = new NodeClass()

  const center = board.view.getBoardCenterPosition()
  node.setPosition(center.x, center.y)

  board.graph.addNode(node)
}

function createNode(_componentId: string, data: any): NodusBaseNode {
  const NodeClass = registry[data.nodeClass]
  if (!NodeClass) throw new Error(`Unknown node class: ${data.nodeClass}`)

  return new NodeClass()
}

board.serializer.deserialize(dampedSineWaveGraph, createNode)
board.graph.evaluate()

function serialize() {
  const result = board.serializer.serialize()
  
  console.log(result)
}

</script>

<template>
  <VGraph :board="board" />
  <VNodeSelector :items="items" class="absolute top-2 left-2" @select="(item) => createNodeManually(item.value)" />
  <button @click="serialize"
    class="absolute top-2 left-14 z-10 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">
    Serialize
  </button>
</template>
