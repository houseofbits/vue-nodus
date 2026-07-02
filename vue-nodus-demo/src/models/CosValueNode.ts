import { NodusBaseNode, NodusPort } from '@houseofbits/vue-nodus'

export default class CosValueNode extends NodusBaseNode {
    constructor() {
        const output = new NodusPort("number", "red")
        const input = new NodusPort("number", "red")

        super(
            "UnaryMathNode",
            [input],
            [output],
            {
                title: 'Cos',
                isPortAutoLayoutEnabled: false,
                width: 130,
            }
        )
    }

    compute(): void {
        this.outputs[0].value = Math.cos(this.inputs[0].value as number)
    }
}
