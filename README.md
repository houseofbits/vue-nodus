# vue-nodus

Build visual node editors for Vue 3 — drag-and-drop node graphs like Blender's shader editor or Unreal Engine's Blueprint system, in under 100 lines of code.

[![npm](https://img.shields.io/npm/v/@houseofbits/vue-nodus)](https://www.npmjs.com/package/@houseofbits/vue-nodus)
[![license](https://img.shields.io/npm/l/@houseofbits/vue-nodus)](LICENSE)
[![feature requests](https://img.shields.io/badge/feature%20requests-open-blue)](https://github.com/houseofbits/vue-nodus/issues/new?template=feature_request.md)

- **Nodes your way** — extend `NodusBaseNode`, drop in a Vue component; the library handles drag, connect, and delete
- **Live data flow** — reactive ports propagate values through the graph automatically via `compute()`, with batched topological re-evaluation
- **Undo/redo history** — drags, deletes, and connections are tracked automatically; `board.history.records` exposes labeled entries for building a history panel
- **Connection styles** — bezier, straight, step, and smooth-step edges (each with a dashed variant), custom edge classes, and a per-connection resolver
- **Typed ports** — connections are validated by port type and direction; inputs accept one connection or many (`isMultiport`)
- **Rich selection** — single click, shift multi-select, and box/marquee select across nodes and connections
- **Pan & zoom canvas** — wheel zoom toward the cursor, right-drag panning, an adaptive dot grid, and a custom `#background` slot
- **Touch support** — one-finger pan, pinch-to-zoom, tap-to-connect, and touch-friendly delete markers
- **Fully themeable** — every visual token is a CSS custom property; restyle the whole editor in one object
- **Serializable** — save and restore nodes, connections, and viewport to plain JSON with a single call
- **Vue 3 native + TypeScript** — Composition API throughout, no Canvas hacks, fully typed with shipped `.d.ts`

## Demo

**[Live demo →](https://houseofbits.github.io/vue-nodus/)**

Or clone the repo and run the interactive playground:

```bash
git clone git@github.com:houseofbits/vue-nodus.git
cd vue-nodus
npm install
npm run demo:dev
```

The demo builds a live math graph — constants flow through math operators (add, multiply, divide, min, max), clamp, condition, and unary math (sin, cos, square, sqrt) nodes into outputs and a live 2D plotter node. It includes a node palette, an undo/redo history toolbar, and loads a saved graph on startup.

There's also a **Web Audio synthesizer** demo built entirely on vue-nodus — oscillators, LFOs, filters, delay, mixer, step sequencer, and an analyser node, with JSON patch presets:

```bash
npm run audio:dev
```

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
