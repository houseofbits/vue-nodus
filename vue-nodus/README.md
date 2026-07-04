# @houseofbits/vue-nodus

[![npm](https://img.shields.io/npm/v/@houseofbits/vue-nodus)](https://www.npmjs.com/package/@houseofbits/vue-nodus)
[![license](https://img.shields.io/npm/l/@houseofbits/vue-nodus)](LICENSE)

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
| Multi-select | Shift + left-click |
| Pan canvas | Right-click drag |
| Zoom | Scroll wheel |
| Connect ports | Click source port, then click target port (same type, opposite direction) |
| Delete selected | Delete key |
| Delete on touch | Tap the × on a selected node's title bar, or on a selected connection |

## Serialization

Save the entire graph state (nodes, connections, viewport) to a plain JSON object:

```ts
const saved = board.serializer.serialize()
// {
//   nodes: { [id]: { ...nodeData, ports: {...} } },
//   connections: { [id]: { sourcePortId, targetPortId, color } },
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

## API reference

### `NodusBoard`

Top-level orchestrator. Create one instance per editor.

| Member | Type | Description |
|---|---|---|
| `graph` | `NodusGraph` | The node graph |
| `view` | `View` | Interaction and rendering state |
| `serializer` | `NodusSerializer` | Save/restore helpers |
| `registerComponent(id, component)` | method | Register a Vue component for a node type |
| `getComponent(id)` | method | Look up a registered component by ID |

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
new NodusConnection(sourcePort: NodusPort, targetPort: NodusPort, color?: string)
```

Connections are created automatically when the user clicks two compatible ports. You only need to instantiate `NodusConnection` directly when restoring from serialized state.

### `NodusSerializer`

Accessed via `board.serializer`.

| Member | Description |
|---|---|
| `serialize()` | Returns a plain `JSON.stringify`-safe object |
| `deserialize(data, factory)` | Restores graph state from a serialized object; `factory` is `(componentId: string, data: any) => NodusBaseNode` |

---

### Component: `VGraph`

| Prop | Type | Required | Description |
|---|---|---|---|
| `board` | `NodusBoard` | yes | The board instance to render |
| `theme` | `Partial<NodusTheme>` | no | Override visual tokens (see [Theming](#theming)) |

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

## License

MIT
