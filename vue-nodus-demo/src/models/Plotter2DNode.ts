import { NodusBaseNode, NodusPort } from '@houseofbits/vue-nodus'

export default class Plotter2DNode extends NodusBaseNode {
    constructor() {
        const output = new NodusPort("number", "red")
        const input = new NodusPort("number", "red")

        super(
            "Plotter2DNode",
            [input],
            [output],
            {
                title: 'Plotter 2D',
                isPortAutoLayoutEnabled: false,
                width: 450,
            }
        )
    }

    compute(): void {

    }
}
