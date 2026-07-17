# @houseofbits/vue-nodus

[![npm](https://img.shields.io/npm/v/@houseofbits/vue-nodus)](https://www.npmjs.com/package/@houseofbits/vue-nodus)
[![license](https://img.shields.io/npm/l/@houseofbits/vue-nodus)](LICENSE)
[![feature requests](https://img.shields.io/badge/feature%20requests-open-blue)](https://github.com/houseofbits/vue-nodus/issues/new?template=feature_request.md)

## Features

- **Custom nodes** — extend `NodusBaseNode` and pair it with your own Vue component; the library handles dragging, connecting, and deleting ([Creating custom nodes](#creating-custom-nodes))
- **Live data flow** — reactive ports propagate values through the graph via `compute()`, with batched re-computation in topological order
- **Undo and redo** — drags, deletes, and interactive connections are tracked automatically; `board.history.records` exposes labeled entries for building a history panel ([Undo and redo](#undo-and-redo))
- **Connection styles** — bezier, straight, step, and smooth-step edges, each with a dashed variant, plus custom edge classes and a per-connection type resolver ([Connection types](#connection-types))
- **Typed ports** — connections are validated by port type and direction; inputs accept a single connection by default or many with `isMultiport`
- **Rich selection** — single click, shift multi-select, and box/marquee select across both nodes and connections
- **Pan & zoom canvas** — wheel zoom toward the cursor, right-drag panning, an adaptive dot grid, and a scoped `#background` slot for custom backdrops ([Interactivity](#interactivity))
- **Touch support** — one-finger pan, pinch-to-zoom, tap-to-connect, and touch-friendly delete markers
- **Fully themeable** — every visual token is a CSS custom property, settable via a typed `theme` prop or plain CSS ([Theming](#theming))
- **Serializable** — save and restore nodes, connections, and viewport to plain JSON with one call ([Serialization](#serialization))
- **Vue 3 native + TypeScript** — Composition API throughout, no Canvas hacks, fully typed with shipped `.d.ts`

## Demo

**[Live demo →](https://houseofbits.github.io/vue-nodus/)**

## Installation

```bash
npm install @houseofbits/vue-nodus
```

Requires Vue 3.5+ as a peer dependency.

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

// Register your custom node component
board.registerComponent('my-node', MyNodeComponent)

// Create and add a node to the graph
const node = new MyNode()
node.setPosition(100, 100)
board.graph.addNode(node)
</script>
```

> `VGraph` must be placed inside a positioned container with an explicit size — it fills 100% of its parent.

## Creating custom nodes

A custom node consists of two parts: a **model class** (extends `NodusBaseNode`) and a **Vue component** that renders it.

### 1. Define the model

```ts
// AddNode.ts
import { NodusBaseNode, NodusPort } from '@houseofbits/vue-nodus'

export default class AddNode extends NodusBaseNode {
  constructor() {
    super(
      'add-node',                           // component ID — must match registerComponent()
      [
        new NodusPort('number', '#4fc3f7'), // input port: type, color
        new NodusPort('number', '#4fc3f7'),
      ],
      [
        new NodusPort('number', '#81c784'), // output port
      ],
      { title: 'Add' }
    )
  }

  compute() {
    const a = (this.inputs[0].value as number) ?? 0
    const b = (this.inputs[1].value as number) ?? 0
    this.outputs[0].value = a + b
  }
}
```

### 2. Write the Vue component

```vue
<!-- AddNode.vue -->
<template>
  <VBaseNode :node="props.node" :is-selected="props.isSelected">
    <template #content>
      <VNodeRow :input-port="props.node.inputs[0]">
        <span>A</span>
      </VNodeRow>
      <VNodeRow :input-port="props.node.inputs[1]">
        <span>B</span>
      </VNodeRow>
      <VNodeRow :output-port="props.node.outputs[0]">
        <span>Result</span>
      </VNodeRow>
    </template>
  </VBaseNode>
</template>

<script setup lang="ts">
import { VBaseNode, VNodeRow } from '@houseofbits/vue-nodus'
import AddNode from './AddNode'

const props = defineProps({
  node: { type: AddNode, required: true },
  isSelected: { type: Boolean, default: false },
})
</script>
```

### 3. Register and use

```ts
import { NodusBoard } from '@houseofbits/vue-nodus'
import AddNode from './AddNode'
import AddNodeComponent from './AddNode.vue'

const board = new NodusBoard()
board.registerComponent('add-node', AddNodeComponent)

const node = new AddNode()
node.setPosition(200, 150)
board.graph.addNode(node)
```

### Port options

```ts
new NodusPort(
  type,           // string — used for connection type-matching
  color?,         // CSS color string, default 'white'
  isMultiport?,   // allow multiple incoming connections, default false
  defaultValue?,  // initial port value
)
```

Two ports can only be connected if they share the same `type` string.

### Node settings

The fourth argument to `NodusBaseNode` accepts optional settings:

```ts
new NodusBaseNode('my-node', inputs, outputs, {
  title: 'My Node',              // shown in the title bar
  width: 200,                    // fixed width in px (null = auto)
  height: 150,                   // fixed height in px (null = auto)
  isThinComponent: true,         // true = wrap in VBaseNode; false = full custom component
  isPortAutoLayoutEnabled: true, // auto-space ports along the node sides
})
```

Set `isThinComponent: false` when your component handles its own outer shell (no `VBaseNode` wrapper).

## Theming

All visual tokens are exposed as CSS custom properties. Pass a `theme` prop to `VGraph` for a typed API, or override the CSS variables on any ancestor element.

### Via the `theme` prop

```vue
<VGraph :board="board" :theme="{
  canvasBg: '#1a1a2e',
  nodeTitleBg: '#6a0dad',
  nodeTitleColor: '#fff',
  nodeContentBg: '#2a2a3e',
  nodeContentBorderColor: '#3a3a5e',
  nodeTitleBorderColor: '#8a4fbf',
  nodeTitleBottomBorder: '#4a1a7e',
  gridDotColor: 'rgba(180, 120, 255, 0.2)',
}" />
```

Import the `NodusTheme` type for typed theme objects:

```ts
import type { NodusTheme } from '@houseofbits/vue-nodus'

const darkTheme: Partial<NodusTheme> = {
  canvasBg: '#1a1a2e',
  nodeTitleBg: '#6a0dad',
}
```

### Via CSS custom properties

Set variables on any ancestor element — they cascade naturally to all components inside that container.

```css
.my-editor {
  --nodus-canvas-bg: #1a1a2e;
  --nodus-node-title-bg: #6a0dad;
  --nodus-node-content-bg: #2a2a3e;
  --nodus-port-size: 16px;
}
```

### Available tokens

| Token | Default | Description |
|---|---|---|
| `--nodus-canvas-bg` | `rgb(48, 48, 48)` | Canvas background color |
| `--nodus-grid-dot-color` | `rgba(120, 170, 255, 0.18)` | Grid dot color |
| `--nodus-grid-dot-size` | `1.5px` | Grid dot radius |
| `--nodus-node-border-radius` | `8px` | Node corner radius |
| `--nodus-node-shadow` | `0 6px 15px rgba(0,0,0,0.2)` | Node drop shadow |
| `--nodus-node-selection-color` | `rgba(255,255,255,1)` | Selection outline color |
| `--nodus-node-selection-width` | `4px` | Selection outline width |
| `--nodus-node-title-bg` | blue gradient | Title bar background (accepts any CSS `background` value) |
| `--nodus-node-title-color` | `white` | Title bar text color |
| `--nodus-node-title-border-color` | `#82c2ff` | Title bar top/left/right border color |
| `--nodus-node-title-bottom-border` | `#005a9e` | Title bar bottom border color |
| `--nodus-node-content-bg` | `#cfcfcf` | Node content area background |
| `--nodus-node-content-border-color` | `#ffffff` | Node content area border color |
| `--nodus-port-size` | `20px` | Port circle diameter |
| `--nodus-port-hover-outline-color` | `rgba(255,255,255,1)` | Port hover outline color |
| `--nodus-port-hover-outline-width` | `3px` | Port hover outline width |
| `--nodus-connection-width` | `4` | Connection stroke width (SVG user units) |
| `--nodus-connection-selection-color` | `white` | Selected connection outline color |
| `--nodus-connection-selection-width` | `12` | Selected connection outline width |

Port and connection **colors** are set per-instance via `NodusPort.color` and `NodusConnection.color`.

## Interactivity

| Action | Gesture |
|---|---|
| Move node | Left-click drag on title bar |
| Select node / connection | Left-click |
| Multi-select | Shift + left-click |
| Box select | Left-click drag on empty canvas (Shift + drag extends the selection) |
| Pan canvas | Right-click drag, or one-finger drag on touch |
| Zoom | Scroll wheel, or two-finger pinch on touch |
| Connect ports | Click source port, then click target port (same type, opposite direction) |
| Delete selected | Delete key |
| Delete on touch | Tap the × on a selected node's title bar, or on a selected connection |
| Undo | Ctrl/Cmd + Z |
| Redo | Ctrl/Cmd + Shift + Z, or Ctrl/Cmd + Y |

## Connection types

Every connection is drawn by a named **connection type**. Eight are built in: `bezier` (the default), `straight`, `step`, and `smoothstep`, each with a `-dashed` variant (`bezier-dashed`, etc.).

### Choosing a type per connection

Register a **resolver** to decide which type applies whenever the user connects two ports. Return a registered name, a `NodusConnectionType` subclass (auto-registered on first use), or `undefined` to fall back to `bezier`:

```ts
board.registerConnectionTypeResolver((source, target) => {
  if (source.type === 'signal') return 'step-dashed'
  return undefined // default bezier
})
```

When restoring a saved graph, each connection keeps the `connectionType` it was created with.

### Custom connection types

Subclass `NodusConnectionType`, implement `buildPath()` and `getMidpoint()`, and register it under a name:

```ts
import { NodusConnectionType } from '@houseofbits/vue-nodus'

class ZigZag extends NodusConnectionType {
  buildPath(x1, y1, x2, y2, invert) {
    const midX = (x1 + x2) / 2
    return `M ${x1} ${y1} L ${midX} ${y2} L ${x2} ${y2}`
  }
  getMidpoint(x1, y1, x2, y2, invert) {
    return { x: (x1 + x2) / 2, y: y2 }
  }
}

board.registerConnectionType('zigzag', new ZigZag())
board.registerConnectionType('zigzag-dashed', new ZigZag({ dashed: true }))
```

A connection type can also set an optional `render` Vue component (receiving `ConnectionRenderProps`) to fully replace the default edge rendering.

> Note: the live preview line shown while dragging out a new connection is always a bezier curve, regardless of the type the resolver will assign.

## Serialization

Save the entire graph state (nodes, connections, viewport) to a plain JSON object:

```ts
const saved = board.serializer.serialize()
// {
//   nodes: { [id]: { ...nodeData, ports: {...} } },
//   connections: { [id]: { sourcePortId, targetPortId, color, connectionType } },
//   board: { panX, panY, zoom }
// }
localStorage.setItem('graph', JSON.stringify(saved))
```

To restore, pass the saved data and a factory function that maps a `componentId` string to a new node instance:

```ts
const saved = JSON.parse(localStorage.getItem('graph')!)

board.serializer.deserialize(saved, (componentId) => {
  switch (componentId) {
    case 'add-node': return new AddNode()
    // add cases for every registered node type
    default: throw new Error(`Unknown node type: ${componentId}`)
  }
})
```

`deserialize` clears the existing graph, recreates all nodes via your factory, restores port values and connections, and resets the viewport — all in one call.

Override `serialize()` / `deserialize()` on your `NodusBaseNode` subclass to persist custom properties:

```ts
serialize() {
  return { label: this.label }
}

deserialize(data: any) {
  this.label = data.label ?? ''
}
```

## Undo and redo

Every board ships with an undo/redo history at `board.history`. The keyboard shortcuts (Ctrl/Cmd + Z to undo, Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y to redo) work out of the box — but restoring a snapshot needs to reconstruct node instances, so you must register a node factory first. It's the same factory shape `serializer.deserialize` uses, so one function serves both:

```ts
const createNode = (componentId: string) => {
  switch (componentId) {
    case 'add-node': return new AddNode()
    default: throw new Error(`Unknown node type: ${componentId}`)
  }
}

board.history.setNodeFactory(createNode)
board.serializer.deserialize(saved, createNode)
```

Calling `undo()`/`redo()` without a factory throws a descriptive error.

### What gets tracked

Node drags (coalesced into a single entry — a click without movement records nothing), node and connection deletes, and interactive connections are pushed onto the undo stack automatically. Programmatic mutations like `graph.addNode()` / `graph.removeNode()` are **not** — call `board.history.snapshot(label)` immediately before them if they should be undoable:

```ts
board.history.snapshot('Node added')
board.graph.addNode(new AddNode())
```

The undo stack holds 50 entries by default; a new action clears the redo stack.

### Building a history panel

`records` returns the undoable actions (oldest first) with human-readable labels like *"Node Add moved"* or *"Connected Add and Output"* — render it alongside `undo()` / `redo()` / `canUndo()` / `canRedo()` for a toolbar or dropdown. See `VHistoryToolbar.vue` in the repository's demo app for a complete example.

For continuous gestures of your own, bracket them with `captureSnapshot()` / `commitGesture()`: capture before the gesture starts, commit when it ends, and nothing is recorded if the state didn't change.

## API reference

### `NodusBoard`

Top-level orchestrator. Create one instance per editor.

| Member | Type | Description |
|---|---|---|
| `graph` | `NodusGraph` | The node graph |
| `view` | `View` | Interaction and rendering state |
| `serializer` | `NodusSerializer` | Save/restore helpers |
| `history` | `NodusHistory` | Undo/redo stacks (see [Undo and redo](#undo-and-redo)) |
| `connectionTypes` | `NodusConnectionTypeRegistry` | Named connection types (see [Connection types](#connection-types)) |
| `registerComponent(id, component)` | method | Register a Vue component for a node type |
| `getComponent(id)` | method | Look up a registered component by ID |
| `registerConnectionType(name, type)` | method | Register a custom `NodusConnectionType` instance |
| `getConnectionType(name)` | method | Look up a registered connection type by name |
| `registerConnectionTypeResolver(resolver)` | method | Decide the connection type for each newly connected port pair |

### `NodusGraph`

Manages nodes and connections. All mutations are reactive.

| Member | Description |
|---|---|
| `nodes` | `Map<string, NodusBaseNode>` |
| `connections` | `Map<string, NodusConnection>` |
| `addNode(node)` | Add a node |
| `removeNode(id)` | Remove a node and its connections |
| `addConnection(conn)` | Add a connection |
| `removeConnection(id)` | Remove a connection |
| `evaluate()` | Re-compute all nodes in topological order |

### `NodusBaseNode`

Extend this class to create custom node types.

```ts
constructor(
  componentId: string,
  inputs: NodusPort[],
  outputs: NodusPort[],
  settings?: {
    title?: string
    width?: number | null
    height?: number | null
    isThinComponent?: boolean
    isPortAutoLayoutEnabled?: boolean
  }
)
```

| Member | Description |
|---|---|
| `id` | Auto-generated UUID |
| `inputs` / `outputs` | `NodusPort` arrays |
| `internalState` | Reactive `{ x, y, zIndex, width, height, title }` |
| `compute()` | Override to propagate output values from inputs |
| `serialize()` | Override to return custom serializable data |
| `deserialize(data)` | Override to restore from serialized data |
| `setPosition(x, y)` | Set canvas position |

### `NodusPort`

```ts
new NodusPort(type: string, color?: string, isMultiport?: boolean, defaultValue?: unknown)
```

| Member | Description |
|---|---|
| `id` | Auto-generated UUID |
| `type` | String tag used for connection type-matching |
| `color` | CSS color string |
| `ioType` | `NodusPortType.Input` or `NodusPortType.Output` (set by the graph) |
| `isMultiport` | Allow multiple incoming connections |
| `value` | Current reactive value |
| `valueRef` | Raw Vue `Ref` — use with `computed`/`watch` |

### `NodusConnection`

```ts
new NodusConnection(sourcePort: NodusPort, targetPort: NodusPort, color?: string, connectionType?: string)
```

`connectionType` is a registry key naming the connection's edge style; it defaults to `'bezier'` (see [Connection types](#connection-types)). Connections are created automatically when the user clicks two compatible ports. You only need to instantiate `NodusConnection` directly when restoring from serialized state.

### `NodusSerializer`

Accessed via `board.serializer`.

| Member | Description |
|---|---|
| `serialize()` | Returns a plain `JSON.stringify`-safe object |
| `deserialize(data, factory)` | Restores graph state from a serialized object; `factory` is `(componentId: string, data: any) => NodusBaseNode` |

### `NodusHistory`

Accessed via `board.history`. See [Undo and redo](#undo-and-redo) for a walkthrough.

| Member | Description |
|---|---|
| `setNodeFactory(factory)` | **Required before `undo()`/`redo()`** — same factory shape as `deserialize` |
| `undo()` / `redo()` | Restore the previous / next state |
| `canUndo()` / `canRedo()` | Whether the respective stack is non-empty (reactive) |
| `records` | `NodusHistoryRecord[]` of undoable actions, oldest first, each with a `label` |
| `snapshot(label)` | Push the current state as an undo point (call before a programmatic mutation) |
| `captureSnapshot()` | Capture state without recording — pair with `commitGesture()` |
| `commitGesture(before, label)` | Record a bracketed gesture; no-op if nothing changed |

---

### Component: `VGraph`

| Prop | Type | Required | Description |
|---|---|---|---|
| `board` | `NodusBoard` | yes | The board instance to render |
| `theme` | `Partial<NodusTheme>` | no | Override visual tokens (see [Theming](#theming)) |

Slots: `default`, `#background` (scoped: `{ panX, panY, zoom }`) — render custom background content (a pattern, image, or canvas) behind the connections and nodes layers. Providing this slot replaces the built-in dot grid; leave it unused to keep the default grid.

### Component: `VBaseNode`

Default node shell with a title bar and content area.

| Prop | Type | Default | Description |
|---|---|---|---|
| `node` | `NodusBaseNode` | required | The node model |
| `isSelected` | `boolean` | `false` | Highlights the node with an outline |

Slots: `#title` (defaults to `node.internalState.title`), `#content`.

### Component: `VNodeRow`

A content row that positions a port on the left or right edge.

| Prop | Type | Description |
|---|---|---|
| `inputPort` | `NodusPort` | Port displayed on the left edge |
| `outputPort` | `NodusPort` | Port displayed on the right edge |

### Component: `VPort`

Renders a single port circle. Used internally by `VBaseNode` and `VNodeRow`. Can be placed manually in fully custom node layouts.

| Prop | Type | Required | Description |
|---|---|---|---|
| `port` | `NodusPort` | yes | The port to render |

## Feature requests

Got ideas or improvements? Open a feature request here:

👉 https://github.com/houseofbits/vue-nodus/issues/new?template=feature_request.md

## License

MIT

