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

        if (port.ioType === PortType.Output) {
            this.addConnection(new Connection(port, this.selectedPort.value))
        } else {
            this.addConnection(new Connection(this.selectedPort.value, port))
        }

        this.selectedPort.value = null
    }

    clearPortSelection() {
        this.selectedPort.value = null
    }

    bringToFront(node: BaseNode) {
        node.setZIndex(this.nextZIndex++)
    }
}