import { NodusBaseNode, NodusPort } from '../../models'

export default class DisplayNode extends NodusBaseNode {
    constructor() {
        super(
            'display-node',
            [new NodusPort('number', '#81c784')],
            [],
            { title: 'Display', width: 180, isPortAutoLayoutEnabled: false }
        )
    }
}
