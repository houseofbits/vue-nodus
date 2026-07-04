import { NodusBaseNode, NodusPort } from '@houseofbits/vue-nodus'

export default class ClampValueNode extends NodusBaseNode {
    constructor() {
        const output = new NodusPort("number", "red")

        const value = new NodusPort("number", "red")
        const min = new NodusPort("number", "red")
        const max = new NodusPort("number", "red")

        super(
            "ClampNode",
            [value, min, max],
            [output],
            {
                title: 'Clamp',
                isPortAutoLayoutEnabled: false,
                width: 130,
            }
        )
    }

    compute(): void {
        const value = this.inputs[0].value as number
        const min = this.inputs[1].value as number
        const max = this.inputs[2].value as number
        this.outputs[0].value = Math.min(Math.max(value, min), max)
    }
}
