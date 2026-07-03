import { NodusBaseNode } from '@houseofbits/vue-nodus'

export default class InfoTextNode extends NodusBaseNode {
    constructor() {
        super(
            "InfoTextNode",
            [],
            [],
            {
                title: 'Info Text',
                isThinComponent: false,
                width: 450,
            }
        )
    }
}
