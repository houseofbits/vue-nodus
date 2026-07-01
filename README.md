# vue-nodus

Build visual node editors for Vue 3 — drag-and-drop node graphs like Blender's shader editor or Unreal Engine's Blueprint system, in under 100 lines of code.

[![npm](https://img.shields.io/npm/v/@houseofbits/vue-nodus)](https://www.npmjs.com/package/@houseofbits/vue-nodus)
[![license](https://img.shields.io/npm/l/@houseofbits/vue-nodus)](LICENSE)

- **Nodes your way** — extend `NodusBaseNode`, drop in a Vue component; the library handles drag, connect, and delete
- **Live data flow** — reactive ports propagate values through the graph automatically via `compute()`
- **Fully themeable** — every visual token is a CSS custom property; restyle the whole editor in one object
- **Serializable** — save and restore complete graph state to plain JSON with a single call
- **Vue 3 native** — Composition API throughout, no Canvas hacks, zero jQuery

## Demo

**[Live demo →](https://houseofbits.github.io/vue-nodus/)**

Or clone the repo and run the interactive playground:

```bash
git clone git@github.com:houseofbits/vue-nodus.git
cd vue-nodus
npm install
npm run demo:dev
```

The demo builds a live math graph — constant values flow through add, multiply, and divide nodes to a live output. Fully editable, pannable, zoomable, and serializable.

## Install

```bash
npm install @houseofbits/vue-nodus
```

Requires Vue 3.5+.

## Quick start

```vue
<template>
  <div style="position: relative; width: 100%; height: 600px;">
    <VGraph :board="board" />
  </div>
</template>

<script setup lang="ts">
import { NodusBoard, NodusPort, VGraph } from '@houseofbits/vue-nodus'
import MyNodeComponent from './MyNode.vue'
import MyNode from './MyNode'

const board = new NodusBoard()
board.registerComponent('my-node', MyNodeComponent)

const node = new MyNode()
node.setPosition(100, 100)
board.graph.addNode(node)
</script>
```

> `VGraph` must be placed inside a positioned container with an explicit size — it fills 100% of its parent.

**[Full documentation →](vue-nodus/README.md)** — custom nodes, theming, serialization, complete API reference.

## License

MIT
