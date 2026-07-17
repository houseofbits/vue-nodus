import NodusConnectionType from './ConnectionType.js'
import { buildStraightPath, getStraightMidpoint } from '../../helpers/svgStraight.js'

export default class NodusStraightConnectionType extends NodusConnectionType {
    buildPath(x1: number, y1: number, x2: number, y2: number): string {
        return buildStraightPath(x1, y1, x2, y2)
    }

    getMidpoint(x1: number, y1: number, x2: number, y2: number) {
        return getStraightMidpoint(x1, y1, x2, y2)
    }
}
