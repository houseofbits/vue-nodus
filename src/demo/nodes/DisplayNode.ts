import { BaseNode, Port } from '../../models'

export default class DisplayNode extends BaseNode {
    constructor() {
        super(
            'display-node',
            [new Port('number', '#81c784')],
            [],
            { title: 'Display', width: 180, isPortAutoLayoutEnabled: false }
        )
    }
}
