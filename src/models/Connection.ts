import Port from './Port'

/**
 * Represents a directed connection from an output port to an input port.
 * Connections are created automatically by `Graph.selectPort()` when the user clicks
 * two compatible ports, or manually via `Graph.addConnection()`.
 *
 * @example
 * const conn = new Connection(sourcePort, targetPort)
 * graph.addConnection(conn)
 */
export default class Connection {
    id = crypto.randomUUID();
    /** ID of the output port this connection originates from. */
    sourcePortId: string
    /** ID of the input port this connection delivers to. */
    targetPortId: string
    /** CSS color of the rendered connection line. */
    color: string

    /**
     * @param portA  - The output (source) port.
     * @param portB  - The input (target) port.
     * @param color  - CSS color for the connection line. Defaults to `'#FFF'`.
     */
    constructor(portA: Port, portB: Port, color: string = '#FFF') {
        this.sourcePortId = portA.id;
        this.targetPortId = portB.id;
        this.color = color
    }
}
