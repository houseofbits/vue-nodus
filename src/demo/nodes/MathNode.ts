import { reactive } from 'vue'
import { BaseNode, Port } from '../../models'

export type MathOperation = 'add' | 'subtract' | 'multiply' | 'divide'

export default class MathNode extends BaseNode {
    state = reactive({ operation: 'add' as MathOperation })

    constructor() {
        super(
            'math-node',
            [new Port('number', '#4fc3f7'), new Port('number', '#4fc3f7')],
            [new Port('number', '#81c784')],
            { title: 'Math', width: 200, isPortAutoLayoutEnabled: false }
        )
        this.outputs[0].value = 0
    }

    compute() {
        const a = Number(this.inputs[0].value ?? 0)
        const b = Number(this.inputs[1].value ?? 0)
        switch (this.state.operation) {
            case 'add':      this.outputs[0].value = a + b; break
            case 'subtract': this.outputs[0].value = a - b; break
            case 'multiply': this.outputs[0].value = a * b; break
            case 'divide':   this.outputs[0].value = b !== 0 ? a / b : 0; break
        }
    }

    serialize() {
        return { operation: this.state.operation }
    }

    deserialize(data: any) {
        if (data.operation) this.state.operation = data.operation
    }
}
