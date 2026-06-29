export enum PortType {
    Input,
    Output,
}

export default class Port {
    id = crypto.randomUUID()
    type: string
    color = "#fff"
    ioType: PortType = PortType.Input

    constructor(type: string, color: string = '#FFF') {
        this.id = crypto.randomUUID();
        this.type = type;
        this.color = color ?? "#fff";
    }
}