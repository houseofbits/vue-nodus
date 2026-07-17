import NodusConnectionType from './ConnectionType.js'
import { buildStepPath, getStepMidpoint } from '../../helpers/svgStep.js'

export default class NodusStepConnectionType extends NodusConnectionType {
    buildPath(x1: number, y1: number, x2: number, y2: number): string {
        return buildStepPath(x1, y1, x2, y2)
    }

    getMidpoint(x1: number, y1: number, x2: number, y2: number) {
        return getStepMidpoint(x1, y1, x2, y2)
    }
}
