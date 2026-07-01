import { NodusBaseNode, NodusPort } from '@houseofbits/vue-nodus'

export default class OutputNode extends NodusBaseNode {
    


    constructor() {
        super(
            "OutputValue",
            [
                new NodusPort("number", "red"),
            ],
            [],
            {
                title: 'Output value',
                isPortAutoLayoutEnabled: false,
                width: 200,
            }
        )
    }
}