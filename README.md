# vue-nodus

A Vue 3 node-graph editor library — build visual node editors like Blender's shader editor or Unreal Engine's Blueprint system.

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
import { Board, BaseNode, Port, VGraph } from '@houseofbits/vue-nodus'
import MyNodeComponent from './MyNode.vue'
import MyNode from './MyNode'

const board = new Board()

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

A custom node consists of two parts: a **model class** (extends `BaseNode`) and a **Vue component** that renders it.

### 1. Define the model

```ts
// AddNode.ts
import { BaseNode, Port } from '@houseofbits/vue-nodus'

export default class AddNode extends BaseNode {
  constructor() {
    super(
      'add-node',                      // component ID — must match registerComponent()
      [
        new Port('number', '#4fc3f7'), // input port: type, color
        new Port('number', '#4fc3f7'),
      ],
      [
        new Port('number', '#81c784'), // output port
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
import { Board } from '@houseofbits/vue-nodus'
import AddNode from './AddNode'
import AddNodeComponent from './AddNode.vue'

const board = new Board()
board.registerComponent('add-node', AddNodeComponent)

const node = new AddNode()
node.setPosition(200, 150)
board.graph.addNode(node)
```

### Port options

```ts
new Port(
  type,           // string — used for connection type-matching
  color?,         // CSS color string, default 'white'
  isMultiport?,   // allow multiple incoming connections, default false
  defaultValue?,  // initial port value
)
```

Two ports can only be connected if they share the same `type` string.

### Node settings

The fourth argument to `BaseNode` accepts optional settings:

```ts
new BaseNode('my-node', inputs, outputs, {
  title: 'My Node',              // shown in the title bar
  width: 200,                    // fixed width in px (null = auto)
  height: 150,                   // fixed height in px (null = auto)
  isThinComponent: true,         // true = wrap in VBaseNode; false = full custom component
  isPortAutoLayoutEnabled: true, // auto-space ports along the node sides
})
```

Set `isThinComponent: false` when your component handles its own outer shell (no `VBaseNode` wrapper).

## Interactivity

| Action | Gesture |
|---|---|
| Move node | Left-click drag on title bar |
| Multi-select | Shift + left-click |
| Pan canvas | Right-click drag |
| Zoom | Scroll wheel |
| Connect ports | Click source port, then click target port (same type, opposite direction) |
| Delete selected | Delete key |

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

Override `serialize()` / `deserialize()` on your `BaseNode` subclass to persist custom properties:

```ts
serialize() {
  return { label: this.label }
}

deserialize(data: any) {
  this.label = data.label ?? ''
}
```

## API reference

### `Board`

Top-level orchestrator. Create one instance per editor.

| Member | Type | Description |
|---|---|---|
| `graph` | `Graph` | The node graph |
| `view` | `View` | Interaction and rendering state |
| `serializer` | `Serializer` | Save/restore helpers |
| `registerComponent(id, component)` | method | Register a Vue component for a node type |
| `getComponent(id)` | method | Look up a registered component by ID |

### `Graph`

Manages nodes and connections. All mutations are reactive.

| Member | Description |
|---|---|
| `nodes` | `Map<string, BaseNode>` |
| `connections` | `Map<string, Connection>` |
| `addNode(node)` | Add a node |
| `removeNode(id)` | Remove a node and its connections |
| `addConnection(conn)` | Add a connection |
| `removeConnection(id)` | Remove a connection |
| `evaluate()` | Re-compute all nodes in topological order |

### `BaseNode`

Extend this class to create custom node types.

```ts
constructor(
  componentId: string,
  inputs: Port[],
  outputs: Port[],
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
| `inputs` / `outputs` | Port arrays |
| `internalState` | Reactive `{ x, y, zIndex, width, height, title }` |
| `compute()` | Override to propagate output values from inputs |
| `serialize()` | Override to return custom serializable data |
| `deserialize(data)` | Override to restore from serialized data |
| `setPosition(x, y)` | Set canvas position |

### `Port`

```ts
new Port(type: string, color?: string, isMultiport?: boolean, defaultValue?: unknown)
```

| Member | Description |
|---|---|
| `id` | Auto-generated UUID |
| `type` | String tag used for connection type-matching |
| `color` | CSS color string |
| `ioType` | `PortType.Input` or `PortType.Output` (set by the graph) |
| `isMultiport` | Allow multiple incoming connections |
| `value` | Current reactive value |
| `valueRef` | Raw Vue `Ref` — use with `computed`/`watch` |

### `Connection`

```ts
new Connection(sourcePort: Port, targetPort: Port, color?: string)
```

Connections are created automatically when the user clicks two compatible ports. You only need to instantiate `Connection` directly when restoring from serialized state.

### `Serializer`

Accessed via `board.serializer`.

| Member | Description |
|---|---|
| `serialize()` | Returns a plain `JSON.stringify`-safe object |
| `deserialize(data, factory)` | Restores graph state from a serialized object; `factory` is `(componentId: string, data: any) => BaseNode` |

---

### Component: `VGraph`

| Prop | Type | Required | Description |
|---|---|---|---|
| `board` | `Board` | yes | The board instance to render |

### Component: `VBaseNode`

Default node shell with a title bar and content area.

| Prop | Type | Default | Description |
|---|---|---|---|
| `node` | `BaseNode` | required | The node model |
| `isSelected` | `boolean` | `false` | Highlights the node with an outline |

Slots: `#title` (defaults to `node.internalState.title`), `#content`.

### Component: `VNodeRow`

A content row that positions a port on the left or right edge.

| Prop | Type | Description |
|---|---|---|
| `inputPort` | `Port` | Port displayed on the left edge |
| `outputPort` | `Port` | Port displayed on the right edge |

### Component: `VPort`

Renders a single port circle. Used internally by `VBaseNode` and `VNodeRow`. Can be placed manually in fully custom node layouts.

| Prop | Type | Required | Description |
|---|---|---|---|
| `port` | `Port` | yes | The port to render |

## License

MIT
