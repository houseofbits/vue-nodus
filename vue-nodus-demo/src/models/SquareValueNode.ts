import { NodusBaseNode, NodusPort } from '@houseofbits/vue-nodus'

export default class SquareValueNode extends NodusBaseNode {
    constructor() {
        const output = new NodusPort("number", "red")
        const input = new NodusPort("number", "red")

        super(
            "UnaryMathNode",
            [input],
            [output],
            {
                title: 'Square',
                isPortAutoLayoutEnabled: false,
                width: 130,
            }
        )
    }

    compute(): void {
        const value = this.inputs[0].value as number
        this.outputs[0].value = value * value
    }
}
