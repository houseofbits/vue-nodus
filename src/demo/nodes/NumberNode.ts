import { NodusBaseNode, NodusPort } from '../../models'

export default class NumberNode extends NodusBaseNode {
    constructor() {
        super(
            'number-node',
            [],
            [new NodusPort('number', '#4fc3f7')],
            { title: 'Number', width: 180, isPortAutoLayoutEnabled: false }
        )
        this.outputs[0].value = 0
    }
}
