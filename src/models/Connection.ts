import Port from './Port'

export default class Connection {
    id = crypto.randomUUID();
    sourcePortId: string;
    targetPortId: string;

    constructor(portA: Port, portB: Port) {
        this.sourcePortId = portA.id;
        this.targetPortId = portB.id;
    }
}