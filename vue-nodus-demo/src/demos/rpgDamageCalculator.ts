import { NodusBoard, NodusConnection } from '@houseofbits/vue-nodus'
import ConstantValueNode from '../models/ConstantValueNode.ts'
import AddValueNode from '../models/AddValueNode.ts'
import MultiplyValueNode from '../models/MultiplyValueNode.ts'
import MaxValueNode from '../models/MaxValueNode.ts'
import ClampValueNode from '../models/ClampValueNode.ts'
import ConditionValueNode from '../models/ConditionValueNode.ts'
import OutputNode from '../models/OutputNode.ts'

const COL = { const: 40, scale: 340, add: 570, floor: 800, crit: 1030, cond: 1260, clamp: 1520, out: 1750 }

function makeConstant(title: string, value: number, x: number, y: number): ConstantValueNode {
    const node = new ConstantValueNode()
    node.internalState.title = title
    node.state.value = value
    node.compute()
    node.setPosition(x, y)
    return node
}

/** Builds and wires a fully-populated "RPG Damage Calculator" graph onto `board`. */
export function populateRpgDamageCalculator(board: NodusBoard): void {
    const graph = board.graph

    const baseAttack = makeConstant('Base Attack', 50, COL.const, 40)
    const defense = makeConstant('Defense', 20, COL.const, 230)
    const critMultiplier = makeConstant('Crit Multiplier', 2, COL.const, 420)
    const attackRoll = makeConstant('Attack Roll', 15, COL.const, 610)
    const defenseThreshold = makeConstant('Defense Threshold', 10, COL.const, 800)

    const attackScaled = new MultiplyValueNode()
    attackScaled.internalState.title = 'Attack x1'
    attackScaled.inputs[1].value = 1
    attackScaled.setPosition(COL.scale, 40)

    const defenseNegated = new MultiplyValueNode()
    defenseNegated.internalState.title = 'Negate Defense'
    defenseNegated.inputs[1].value = -1
    defenseNegated.setPosition(COL.scale, 230)

    const netAttack = new AddValueNode()
    netAttack.setPosition(COL.add, 135)

    const normalDamage = new MaxValueNode()
    normalDamage.internalState.title = 'Normal Damage'
    normalDamage.inputs[1].value = 0
    normalDamage.setPosition(COL.floor, 135)

    const critDamage = new MultiplyValueNode()
    critDamage.internalState.title = 'Crit Damage'
    critDamage.setPosition(COL.crit, 280)

    const isCrit = new ConditionValueNode()
    isCrit.internalState.title = 'Roll >= Threshold?'
    isCrit.state.operator = 'gte'
    isCrit.setPosition(COL.cond, 380)

    const finalDamage = new ClampValueNode()
    finalDamage.inputs[1].value = 0
    finalDamage.inputs[2].value = 999
    finalDamage.setPosition(COL.clamp, 450)

    const output = new OutputNode()
    output.internalState.title = 'Damage Dealt'
    output.setPosition(COL.out, 450)

    for (const node of [
        baseAttack, defense, critMultiplier, attackRoll, defenseThreshold,
        attackScaled, defenseNegated, netAttack, normalDamage, critDamage,
        isCrit, finalDamage, output,
    ]) {
        graph.addNode(node)
    }

    graph.addConnection(new NodusConnection(baseAttack.outputs[0], attackScaled.inputs[0]))
    graph.addConnection(new NodusConnection(defense.outputs[0], defenseNegated.inputs[0]))
    graph.addConnection(new NodusConnection(attackScaled.outputs[0], netAttack.inputs[0]))
    graph.addConnection(new NodusConnection(defenseNegated.outputs[0], netAttack.inputs[1]))
    graph.addConnection(new NodusConnection(netAttack.outputs[0], normalDamage.inputs[0]))
    graph.addConnection(new NodusConnection(normalDamage.outputs[0], critDamage.inputs[0]))
    graph.addConnection(new NodusConnection(critMultiplier.outputs[0], critDamage.inputs[1]))
    graph.addConnection(new NodusConnection(attackRoll.outputs[0], isCrit.inputs[0]))
    graph.addConnection(new NodusConnection(defenseThreshold.outputs[0], isCrit.inputs[1]))
    graph.addConnection(new NodusConnection(critDamage.outputs[0], isCrit.inputs[2]))
    graph.addConnection(new NodusConnection(normalDamage.outputs[0], isCrit.inputs[3]))
    graph.addConnection(new NodusConnection(isCrit.outputs[0], finalDamage.inputs[0]))
    graph.addConnection(new NodusConnection(finalDamage.outputs[0], output.inputs[0]))

    // addConnection() only copies the current value across; it never calls compute().
    // A full topological pass is required so every derived node's output is populated on load.
    graph.evaluate()

    // Zoom out so the whole pre-built graph is visible without manual panning.
    board.view.viewport.state.zoom = 0.65
    board.view.viewport.state.panX = 40
    board.view.viewport.state.panY = 40
}
