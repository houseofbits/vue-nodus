import { NodusBaseNode, NodusPort } from '@houseofbits/vue-nodus'

export default class SqrtValueNode extends NodusBaseNode {
    constructor() {
        const output = new NodusPort("number", "red")
        const input = new NodusPort("number", "red")

        super(
            "UnaryMathNode",
            [input],
            [output],
            {
                title: 'Sqrt',
                isPortAutoLayoutEnabled: false,
                width: 130,
            }
        )
    }

    compute(): void {
        this.outputs[0].value = Math.sqrt(this.inputs[0].value as number)
    }
}
