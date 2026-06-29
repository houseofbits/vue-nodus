export enum PortType {
    Input,
    Output,
}

export default class Port {
    id = crypto.randomUUID()
    type: string
    color = "white"
    ioType: PortType = PortType.Input
    isMultiport: boolean = false

    constructor(type: string, color: string = 'white', isMultiport: boolean = false) {
        this.id = crypto.randomUUID()
        this.type = type
        this.color = color ?? "white"
        this.isMultiport = isMultiport
    }
}