import { BaseNode, Port } from '../../models'

export default class NumberNode extends BaseNode {
    constructor() {
        super(
            'number-node',
            [],
            [new Port('number', '#4fc3f7')],
            { title: 'Number', width: 180, isPortAutoLayoutEnabled: false }
        )
        this.outputs[0].value = 0
    }
}
