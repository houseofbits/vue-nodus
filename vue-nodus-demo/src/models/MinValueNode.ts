import { NodusBaseNode, NodusPort } from '@houseofbits/vue-nodus'

export default class MinValueNode extends NodusBaseNode {
    constructor() {
        const output = new NodusPort("number", "red")

        const input1 = new NodusPort("number", "red")
        const input2 = new NodusPort("number", "red")

        super(
            "MathNode",
            [input1, input2],
            [output],
            {
                title: 'Min',
                isPortAutoLayoutEnabled: false,
                width: 130,
            }
        )
    }

    compute(): void {
        this.outputs[0].value = Math.min(this.inputs[0].value as number, this.inputs[1].value as number)
    }
}
