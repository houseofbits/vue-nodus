import NodusConnectionType from './ConnectionType.js'
import { buildBezierPath, getBezierMidpoint } from '../../helpers/svgBezier.js'

export default class NodusBezierConnectionType extends NodusConnectionType {
    buildPath(x1: number, y1: number, x2: number, y2: number, invert: boolean): string {
        return buildBezierPath(x1, y1, x2, y2, invert)
    }

    getMidpoint(x1: number, y1: number, x2: number, y2: number, invert: boolean) {
        return getBezierMidpoint(x1, y1, x2, y2, invert)
    }
}
