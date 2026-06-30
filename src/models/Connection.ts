import NodusPort from './Port'

/**
 * Represents a directed connection from an output port to an input port.
 * Connections are created automatically by `NodusGraph.selectPort()` when the user clicks
 * two compatible ports, or manually via `NodusGraph.addConnection()`.
 *
 * @example
 * const conn = new NodusConnection(sourcePort, targetPort)
 * graph.addConnection(conn)
 */
export default class NodusConnection {
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
    constructor(portA: NodusPort, portB: NodusPort, color: string = '#FFF') {
        this.sourcePortId = portA.id;
        this.targetPortId = portB.id;
        this.color = color
    }
}
