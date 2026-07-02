import { NodusBaseNode, NodusPort } from '@houseofbits/vue-nodus'
import { reactive } from 'vue'

export type ComparisonOperator = 'lt' | 'lte' | 'gt' | 'gte' | 'eq'

interface InternalState {
    operator: ComparisonOperator
}

export default class ConditionValueNode extends NodusBaseNode {
    state: InternalState = reactive({
        operator: 'lt',
    })

    constructor() {
        const output = new NodusPort("number", "red")

        const inputA = new NodusPort("number", "red")
        const inputB = new NodusPort("number", "red")
        const inputThen = new NodusPort("number", "red")
        const inputElse = new NodusPort("number", "red")

        super(
            "ConditionNode",
            [inputA, inputB, inputThen, inputElse],
            [output],
            {
                title: 'If',
                isPortAutoLayoutEnabled: false,
                width: 160,
            }
        )
    }

    compute(): void {
        const a = this.inputs[0].value as number
        const b = this.inputs[1].value as number

        const comparisons: Record<ComparisonOperator, boolean> = {
            lt: a < b,
            lte: a <= b,
            gt: a > b,
            gte: a >= b,
            eq: a === b,
        }

        this.outputs[0].value = comparisons[this.state.operator]
            ? this.inputs[2].value
            : this.inputs[3].value
    }
}
