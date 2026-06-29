import Connection from './Connection'
import BaseNode from './BaseNode'
import Port, { PortType } from './Port'
import { reactive, ref } from 'vue';

export default class Graph {
    nodes: Map<string, BaseNode> = new Map()
    connections: Map<string, Connection> = reactive(new Map())
    selectedPort = ref<Port | null>(null)
    nextZIndex = 1

    constructor() {

    }

    addNode(node: BaseNode) {
        this.nodes.set(node.id, node)
    }

    removeNode(id: string) {
        this.nodes.delete(id)
    }

    addConnection(conn: Connection) {
        this.connections.set(conn.id, conn)
    }

    removeConnection(id: string) {
        this.connections.delete(id)
    }

    selectPort(port: Port) {
        if (!this.selectedPort.value) {
            this.selectedPort.value = port

            return
        }

        if (this.selectedPort.value.id === port.id) {
            this.selectedPort.value = null;

            return
        }

        if (this.selectedPort.value.ioType === port.ioType) {
            this.selectedPort.value = null;

            return
        }

        if (this.selectedPort.value.type !== port.type) {
            this.selectedPort.value = null;

            return
        }

        const existing = Object.values(this.connections).find(
            con =>
                (con.sourcePortId === port.id &&
                    con.targetPortId === this.selectedPort.value?.id) ||
                (con.targetPortId === port.id &&
                    con.sourcePortId === this.selectedPort.value?.id)
        )

        if (existing) {
            this.selectedPort.value = null;

            return
        }

        let source = this.selectedPort.value
        let target = port

        if (port.ioType === PortType.Output) {
            source = port
            target = this.selectedPort.value
        }

        if (this.validateInputPortConnection(target)) {
            this.addConnection(new Connection(source, target, target.color))
        }

        this.selectedPort.value = null
    }

    clearPortSelection() {
        this.selectedPort.value = null
    }

    bringToFront(node: BaseNode) {
        node.setZIndex(this.nextZIndex++)
    }

    private validateInputPortConnection(port: Port) {
        if (port.isMultiport === false) {
            const value = [...this.connections.values()].find(con => con.targetPortId === port.id)
            if (value) {
                return false
            }
        }

        return true
    }
}