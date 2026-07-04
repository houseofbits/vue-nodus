import { NodusBaseNode, NodusPort } from '@houseofbits/vue-nodus'

export default class SinValueNode extends NodusBaseNode {
    constructor() {
        const output = new NodusPort("number", "red")
        const input = new NodusPort("number", "red")

        super(
            "UnaryMathNode",
            [input],
            [output],
            {
                title: 'Sin',
                isPortAutoLayoutEnabled: false,
                width: 130,
            }
        )
    }

    compute(): void {
        this.outputs[0].value = Math.sin(this.inputs[0].value as number)
    }
}
