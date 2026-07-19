# @houseofbits/vue-nodus — library reference

A Vue 3 node editor / blueprint library. This file is a dev-facing API reference for working
in this package's source (`src/`) — for consumer-facing docs (install, theming CSS tokens,
custom-node walkthrough, quick start) see `README.md`, which remains the source of truth for that.

- **Entry point**: `src/index.ts` re-exports everything from `models/`, `components/`, and the
  `NodusTheme` type from `theme.ts`.
- **Tech stack**: Vue 3.5+ (peer dep), TypeScript 5.9 (strict), Vite 8 build (`vite-plugin-dts`
  for `.d.ts` generation, `vite-plugin-css-injected-by-js`), Vitest 1.6 + `@vue/test-utils` +
  `happy-dom`, ESLint flat config (typescript-eslint recommendedTypeChecked + eslint-plugin-vue),
  Prettier (no semicolons, single quotes, 4-space tabs, 100 print width). Node >=22.
- **Package entry points**: `main`/`module` → `dist/index.js`, `types` → `dist/index.d.ts`.

## Dev workflow

Run from `vue-nodus/` (or via root `npm run <script> --workspace @houseofbits/vue-nodus`):

| Script | What it does |
|---|---|
| `npm run tsc` | `vue-tsc --noEmit` — type-check only |
| `npm run lint` | `eslint src` |
| `npm run build` | `vite build` — produces `dist/` |
| `npm run dev` | `vite build --watch` |
| `npm run demo` | `vite` — serves the local playground under `src/` (separate from the two workspace demo apps) |
| `npm run test` | `vitest run` |
| `npm run test:watch` | `vitest` (watch mode) |

## Testing

`src/__tests__/` — 15 files, ~2300 lines, Vitest + `happy-dom` (`environment: 'happy-dom'`,
`globals: true` per `vitest.config.ts`):

- `graph.test.ts` (largest) — connect/disconnect, `evaluate()`, dirty-flush batching, topological
  sort, `selectPort()` validation
- `history.test.ts` — undo/redo, `snapshot()`, `commitGesture()`, factory requirement
- `baseNode.test.ts`, `port.test.ts`, `serializer.test.ts`, `connectionTypeRegistry.test.ts`
- `view.test.ts` — drag/pan/zoom/box-select/keyboard shortcuts
- `viewport.test.ts`, `selectionController.test.ts`, `resize.test.ts`
- `VGraph.test.ts` — component-level, via `@vue/test-utils`
- `svgBezier.test.ts`, `svgStep.test.ts`, `svgSmoothStep.test.ts`, `svgStraight.test.ts` — one per
  connection-type path-builder

## Architecture

- **Node/port/graph model**: a `NodusBaseNode` holds `inputs`/`outputs` arrays of `NodusPort`.
  `NodusGraph` tracks nodes/connections in reactive `Map`s plus an internal `portToNode` index
  for O(1) port→node lookup. Connections are always directed output → input.
- **Reactive port values**: `NodusPort` wraps a private Vue `Ref` (`_value`), exposed via a
  `value` getter/setter (through `toRaw()`) and a raw `valueRef` for `watch`/`computed`. When
  `graph.addConnection()` runs, it sets up a `watch(() => sourcePort.value, ...)` that pushes the
  new value into the target port and marks the target node dirty.
- **Two evaluation paths**:
  - `graph.evaluate()` — full topological sort, calls `compute()` on every node in order (nodes
    in cycles run last). Call after programmatic port-value changes to propagate updates.
  - **Dirty-tracking** (automatic, on connected value change): `markDirty(nodeId)` walks the
    entire downstream reachability closure of the changed node (not just the immediate target)
    and schedules one batched `flushDirty()` on `nextTick()`. Walking the full closure up front —
    rather than recomputing incrementally — is what guarantees a node never sees a mix of
    stale/fresh sibling inputs when its inputs converge from paths of different length off a
    shared changing ancestor (`Graph.ts:181-187`).
- **Undo/redo**: `NodusHistory` snapshots the *entire graph* as JSON via `NodusSerializer`
  (50-entry cap on both undo/redo stacks), not diff-based. Requires
  `history.setNodeFactory(factory)` to be called once — `undo()`/`redo()` throw otherwise. Node
  drags/resizes (bracketed via `captureSnapshot()` + `commitGesture()`), deletes, and interactive
  connects (`graph.selectPort()`) auto-push undo points. Programmatic `graph.addNode()` /
  `removeNode()` do **not** — call `history.snapshot(label)` yourself first if such a change
  should be undoable.
- **Connection type resolution**: each connection has a `connectionType` string key. Geometry is
  decoupled into `NodusConnectionType` subclasses, resolved per-board through
  `NodusConnectionTypeRegistry` (pre-seeded with 8 built-ins) and an optional per-connection
  `ConnectionTypeResolver` callback (used only for interactive `selectPort()` connections, never
  for `addConnection()` calls that already carry an explicit type, e.g. from deserialization).
- **Interaction/view layer** (not part of the public API surface, but what makes `VGraph` work):
  - `View.ts` (563 lines, the biggest model file) — owns pointer/keyboard event wiring
    (`mount`/`unmount` on a DOM element), drag/resize/box-select gesture state machines, delegates
    pan/zoom to `Viewport`, and brackets undo points around gestures.
  - `Viewport.ts` — screen↔world coordinate transforms, zoom-toward-cursor math.
  - `SelectionController.ts` — tracks selected nodes/connections.
  - `PortRegistry.ts` — tracks live screen positions of port DOM elements (rAF-coalesced,
    `ResizeObserver`-driven) so `VConnectionsLayer` can draw connection SVG paths.

## Models API (`src/models/`)

### `NodusGraph` (default export) — `models/Graph.ts:11`
Owns the reactive `nodes: Map<string, NodusBaseNode>` and `connections: Map<string, NodusConnection>`.

```ts
constructor(connectionTypeRegistry?: NodusConnectionTypeRegistry)
addNode(node: NodusBaseNode): void
removeNode(id: string): void                    // also removes all connections touching its ports
addConnection(conn: NodusConnection): void       // sets up value-sync watcher; calls onPortConnected on both nodes
removeConnection(id: string): void               // stops watcher; calls onPortDisconnected on both nodes
getNodeByPortId(portId: string): NodusBaseNode | undefined
getConnectedNodes(port: NodusPort): NodusBaseNode[]   // immediate downstream neighbors of an output port
getSourceNodes(port: NodusPort): NodusBaseNode[]      // immediate upstream neighbor(s) of an input port
evaluate(): void                                 // full topological recompute of every node
selectPort(port: NodusPort, event?: PointerEvent): void   // interactive click-to-connect w/ validation + console.warn on mismatch
clearPortSelection(): void
bringToFront(node: NodusBaseNode): void
registerConnectionTypeResolver(resolver: ConnectionTypeResolver): void
selectedPort: ShallowRef<NodusPort | null>
```

### `NodusBoard` (default export) — `models/Board.ts:20`
Top-level orchestrator — create one per editor instance, pass to `<VGraph :board="board" />`.

```ts
constructor()
graph: NodusGraph
view: View
serializer: NodusSerializer
history: NodusHistory
connectionTypes: NodusConnectionTypeRegistry
registerComponent(id: string, component: Component): void   // id must match NodusBaseNode.componentId
getComponent(id: string): Component | undefined
registerConnectionType(name: string, type: NodusConnectionType): void
getConnectionType(name: string): NodusConnectionType | undefined
registerConnectionTypeResolver(resolver: ConnectionTypeResolver): void
```

### `NodusBaseNode` (default export) — `models/BaseNode.ts:54`
Base class to extend for custom node types.

```ts
constructor(componentId: string, inputs: NodusPort[], outputs: NodusPort[], settings?: Partial<NodusSettingObject>)
id: string                                  // crypto.randomUUID()
componentId: string
inputs: NodusPort[]
outputs: NodusPort[]
graph?: Raw<NodusGraph>                     // set by graph.addNode(), cleared by removeNode()
internalState: NodusInternalState           // reactive: x, y, zIndex, width, height, title
setPosition(x: number, y: number): void
setSize(width: number, height: number): void
setZIndex(zIndex: number): void
compute(): void                             // override — recompute outputs from inputs
onPortConnected(port: NodusPort, otherNode: NodusBaseNode, otherPort: NodusPort): void    // override
onPortDisconnected(port: NodusPort, otherNode: NodusBaseNode, otherPort: NodusPort): void // override
getChildren(port: NodusPort): NodusBaseNode[]   // downstream nodes off an output port
getParents(port: NodusPort): NodusBaseNode[]    // upstream node(s) off an input port
serialize(): object                         // override — custom data to persist
deserialize(data: object): void             // override — restore custom data
```

`NodusInternalState` (`BaseNode.ts:6`): `{ x, y, zIndex, width: number|null, height: number|null, title }`.

`NodusSettingObject` (`BaseNode.ts:16`, all optional via `Partial<>`):
- `isThinComponent` (default `true`) — wrap in `VBaseNode` (title bar + content); `false` = fully custom component
- `title`, `width`/`height` (default `null` = auto-size), `isResizable` (default `false`)
- `isPortAutoLayoutEnabled` (default `true`) — auto-distribute ports on left/right edges; `false` to position manually via `VNodeRow`

### `NodusConnection` (default export) — `models/Connection.ts:12`
```ts
constructor(portA: NodusPort, portB: NodusPort, color: string = '#FFF', connectionType: string = 'bezier')
id: string
sourcePortId: string     // output port id
targetPortId: string     // input port id
color: string
connectionType: string   // registry key
```

### `NodusPort` (default export) + `NodusPortType` enum — `models/Port.ts:18,3`
```ts
enum NodusPortType { Input, Output }

constructor(type: string, color: string = 'white', isMultiport: boolean = false, defaultValue: unknown = undefined)
id: string
type: string              // only ports with matching type can connect
color: string
ioType: NodusPortType      // set automatically by NodusBaseNode's constructor
isMultiport: boolean       // false = only one incoming connection allowed
get/set value: unknown     // backed by a private Vue Ref, accessed through toRaw()
get valueRef: Ref<unknown> // use in watch()/computed()
```

### `NodusSerializer` (default export) — `models/Serializer.ts:11`
```ts
constructor(graph: NodusGraph, viewport: Viewport)
serialize(): { nodes, connections, board: {panX, panY, zoom} }   // JSON-safe
deserialize(data: any, factory: (componentId: string, data: any) => NodusBaseNode): void   // clears graph first
```

### `NodusHistory` (default export) — `models/History.ts:46`
```ts
constructor(serializer: NodusSerializer, maxSize: number = 50)
setNodeFactory(factory: (componentId: string, data: any) => NodusBaseNode): void   // required before undo()/redo()
setPortRegistry(portRegistry: PortRegistry): void
canUndo(): boolean
canRedo(): boolean
get records: NodusHistoryRecord[]           // oldest-first, for a history list/panel
captureSnapshot(): string                    // capture without recording — pair with commitGesture()
snapshot(label: string): void                // push undo point immediately (delete, connect)
commitGesture(before: string, label: string): void   // push `before` only if state changed since capture
undo(): void                                  // throws if no factory registered
redo(): void
```
`NodusHistoryRecord` (`History.ts:28`): `{ label: string }`.

### Connection types — `models/connectionTypes/`
```ts
abstract class NodusConnectionType {
    constructor(options?: { dashed?: boolean })     // sets dashArray to '8 6' if dashed
    dashArray?: string
    abstract buildPath(x1, y1, x2, y2, invert: boolean): string
    abstract getMidpoint(x1, y1, x2, y2, invert: boolean): Vector2
    render?: Component    // optional full custom rendering, receives ConnectionRenderProps
}
```
Built-ins: `NodusBezierConnectionType`, `NodusStraightConnectionType`, `NodusStepConnectionType`,
`NodusSmoothStepConnectionType` (`connectionTypes/*.ts`).

```ts
class NodusConnectionTypeRegistry {
    constructor()   // pre-registers 'bezier'/'step'/'smoothstep'/'straight', each + '-dashed' variant
    register(name: string, type: NodusConnectionType): void   // warns + no-op if name taken
    get(name: string): NodusConnectionType | undefined
    resolveKeyForClassOrName(value: string | ConnectionTypeConstructor): string   // auto-registers class ctors on first use
}
```

Supporting types (`connectionTypes/ConnectionType.ts` / `ConnectionTypeRegistry.ts`):
- `NodusConnectionTypeOptions` — `{ dashed?: boolean }`
- `ConnectionRenderProps` — `{ connection, source, target, path, midpoint, selected }` (passed to a custom `render` component)
- `ConnectionTypeConstructor` — `new () => NodusConnectionType`
- `ConnectionTypeResolver` — `(source, target) => string | ConnectionTypeConstructor | undefined`

### Internal-only helpers (not exported from `index.ts`)
- `helpers/svgBezier.ts` — `bezierControlPoints`, `buildBezierPath`, `getBezierMidpoint`
- `helpers/svgStraight.ts` — `buildStraightPath`, `getStraightMidpoint`
- `helpers/svgStep.ts` — `stepMidX`, `buildStepPath`, `getStepMidpoint`
- `helpers/svgSmoothStep.ts` — `buildSmoothStepPath`, `getSmoothStepMidpoint`
- `theme.ts` — only the `NodusTheme` type is public; default theme values live in component CSS custom-property fallbacks (see `VGraph.vue`'s `themeVars`)
- `types/Vector2.ts` — `{ x: number; y: number }`, used throughout the geometry/viewport code

## Components API (`src/components/`)

### `VGraph` — `components/VGraph.vue`
Top-level canvas. `provide('board', board)` for descendants to `inject<NodusBoard>('board')`.
```
props: board: NodusBoard (required), theme?: Partial<NodusTheme>
slots: default; #background(scoped: { panX, panY, zoom })
```
Renders one child per `board.graph.nodes` entry: wraps in `VBaseNode` if `node.isThinComponent`,
otherwise renders the registered component directly as the node's own root.

### `VBaseNode` — `components/VBaseNode.vue`
Default node shell (title bar + content area + auto-laid-out ports + optional resize handle).
```
props: node: NodusBaseNode (required), isSelected?: boolean
slots: #title (defaults to node.internalState.title), #content
```
Must be used inside `VGraph` (injects `'board'`, throws otherwise).

### `VNodeRow` — `components/VNodeRow.vue`
A content row with an optional port on its left (input) or right (output) edge — for nodes with
`isPortAutoLayoutEnabled: false` that want manual, labeled port placement.
```
props: inputPort?: NodusPort, outputPort?: NodusPort
slots: default (row label/content)
```

### `VPort` — `components/VPort.vue`
Renders a single port circle; registers/unregisters itself with `board.view.portRegistry` on
mount/unmount (position tracked via `ResizeObserver`). Click-to-connect via `graph.selectPort()`.
```
props: port: NodusPort (required)
```

### `VConnectionsLayer` — `components/VConnectionsLayer.vue`
Internal — rendered once by `VGraph`. Draws all connections as SVG paths (hit-area + selection
outline + visible stroke + touch delete marker), or delegates to a connection type's custom
`render` component when set. Also draws the live in-progress connection line while a port is
selected. Not meant to be used standalone.

## Theme (`NodusTheme`, `theme.ts`)

A flat object of optional CSS values passed as `VGraph`'s `theme` prop; each field maps to a
`--nodus-*` CSS custom property consumed by component `<style>` blocks (fallback values live
inline in each component, e.g. `var(--nodus-node-border-radius, 8px)`). Fields: `canvasBg`,
`gridDotColor`, `gridDotSize`, `nodeBorderRadius`, `nodeShadow`, `nodeSelectionColor`,
`nodeSelectionWidth`, `selectionBoxBorderColor`, `selectionBoxBg`, `nodeTitleBg`, `nodeTitleColor`,
`nodeTitleBorderColor`, `nodeTitleBottomBorder`, `nodeContentBg`, `nodeContentBorderColor`,
`portSize`, `portHoverOutlineColor`, `portHoverOutlineWidth`, `resizeHandleColor`,
`resizeHandleSize`, `connectionWidth`, `connectionSelectionColor`, `connectionSelectionWidth`.
