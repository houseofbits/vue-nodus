import Port from './Port'

export default class Connection {
    id = crypto.randomUUID();
    sourcePortId: string
    targetPortId: string
    color: string

    constructor(portA: Port, portB: Port, color: string = '#FFF') {
        this.sourcePortId = portA.id;
        this.targetPortId = portB.id;
        this.color = color
    }
}