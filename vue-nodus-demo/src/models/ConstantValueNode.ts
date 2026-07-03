import { NodusBaseNode, NodusPort } from '@houseofbits/vue-nodus'
import { reactive } from 'vue'

interface InternalState {
    value: number
}

export default class ConstantValueNode extends NodusBaseNode {
    state: InternalState = reactive({
        value: 0,
    })

    constructor() {
        const output = new NodusPort("number", "red")

        super(
            "ConstantValue",
            [],
            [output],
            {
                title: 'Constant value',
                isPortAutoLayoutEnabled: false,
                width: 200,
            }
        )
        
        output.value = this.state.value
    }

    compute(): void {
        this.outputs[0].value = this.state.value
    }

    serialize() {
        return { value: this.state.value }
    }

    deserialize(data: any) {
        if (data.value !== undefined) this.state.value = data.value
    }
}