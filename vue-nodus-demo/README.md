# vue-nodus-demo

Interactive math-graph playground for [`@houseofbits/vue-nodus`](../vue-nodus/README.md). Constants flow through math and logic nodes into outputs and a live 2D plotter — the graph recomputes reactively as you edit it.

**[Live demo →](https://houseofbits.github.io/vue-nodus/)**

## Running

From the repository root:

```bash
npm install
npm run demo:dev
```

Or from this directory: `npm run dev`. Build with `npm run build`, preview the build with `npm run preview`.

## What it demonstrates

- **Custom nodes** — 15 node classes in [`src/models/`](src/models) paired with Vue components in [`src/components/`](src/components), covering both one-component-per-node (`VConstantValueNode`) and one component shared by several node classes (`VMathNode` renders Add, Multiply, Divide, Min, and Max)
- **Reactive data flow** — every node overrides `compute()`; edit a constant and watch values propagate to outputs and the plotter
- **Node palette** — `VNodeSelector` spawns new nodes at the canvas center via `board.view.getBoardCenterPosition()`
- **Undo/redo** — `VHistoryToolbar` binds to `board.history` (`undo`/`redo`/`canUndo`/`canRedo`) and renders `history.records` as a dropdown history list
- **Serialization** — a saved graph ([`src/demos/dampedSineWave.json`](src/demos/dampedSineWave.json)) is deserialized on startup with a node factory, followed by `board.graph.evaluate()`; the same factory powers undo/redo via `board.history.setNodeFactory()`

## Node types

| Node | Component | Description |
|---|---|---|
| ConstantValue | `VConstantValueNode` | Editable numeric source |
| Add / Multiply / Divide / Min / Max | `VMathNode` (shared) | Two-input math operators |
| Clamp | `VClampNode` | Clamps a value between min and max |
| Condition | `VConditionNode` | Selects between inputs based on a comparison |
| Sin / Cos / Square / Sqrt | `VUnaryMathNode` (shared) | Single-input math functions |
| Plotter2D | `VPlotter2DNode` | Plots incoming values as a live 2D curve |
| Output | `VOutputNode` | Displays the final computed value |
| InfoText | `VInfoTextNode` | Free-text annotation node |

## Adding a node type

1. Create a model in `src/models/` extending `NodusBaseNode` with your ports and `compute()`.
2. Create (or reuse) a component in `src/components/` and register it with `board.registerComponent(componentId, component)` in [`src/App.vue`](src/App.vue).
3. Add the model class to the `registry` map in `App.vue` — that puts it in the palette and makes it restorable by the serializer and history factory.

See the main library README for the full API: [custom nodes](../vue-nodus/README.md#creating-custom-nodes), [theming](../vue-nodus/README.md#theming), [serialization](../vue-nodus/README.md#serialization), [undo and redo](../vue-nodus/README.md#undo-and-redo).
