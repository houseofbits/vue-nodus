import { NodusBaseNode } from '@houseofbits/vue-nodus'
import { reactive } from 'vue'

interface InternalState {
    text: string
}

export default class InfoTextNode extends NodusBaseNode {
    state: InternalState = reactive({
        text: '',
    })

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

    serialize() {
        return { text: this.state.text }
    }

    deserialize(data: any) {
        if (data.text !== undefined) this.state.text = data.text
    }
}
