import NodusConnectionType from './ConnectionType.js'
import { buildSmoothStepPath, getSmoothStepMidpoint } from '../../helpers/svgSmoothStep.js'

export default class NodusSmoothStepConnectionType extends NodusConnectionType {
    buildPath(x1: number, y1: number, x2: number, y2: number): string {
        return buildSmoothStepPath(x1, y1, x2, y2)
    }

    getMidpoint(x1: number, y1: number, x2: number, y2: number) {
        return getSmoothStepMidpoint(x1, y1, x2, y2)
    }
}
