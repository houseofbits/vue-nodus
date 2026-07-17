import type { Component } from 'vue'
import type Vector2 from '../../types/Vector2.js'
import type NodusConnection from '../Connection.js'

export interface NodusConnectionTypeOptions {
    /** When true, sets `dashArray` to a default dashed pattern. */
    dashed?: boolean
}

/** Props passed to a connection type's optional `render` component. */
export interface ConnectionRenderProps {
    connection: NodusConnection
    source: Vector2 | undefined
    target: Vector2 | undefined
    /** Pre-built path `d` string from this type's own `buildPath` (convenience). */
    path: string | undefined
    midpoint: Vector2 | undefined
    selected: boolean
}

/**
 * Extendable base class describing a connection's geometry and (optionally) its rendering.
 * Subclass to add a custom connection shape, then register it on
 * `NodusBoard.connectionTypes` (or via `board.registerConnectionType(name, type)`).
 *
 * @example
 * class DottedStraight extends NodusConnectionType {
 *     buildPath(x1, y1, x2, y2) { return buildStraightPath(x1, y1, x2, y2) }
 *     getMidpoint(x1, y1, x2, y2) { return getStraightMidpoint(x1, y1, x2, y2) }
 * }
 * board.registerConnectionType('dotted-straight', new DottedStraight({ dashed: true }))
 */
export default abstract class NodusConnectionType {
    /** SVG `stroke-dasharray` applied to the visible-stroke path only. `undefined` means a solid line. */
    dashArray?: string

    constructor(options: NodusConnectionTypeOptions = {}) {
        this.dashArray = options.dashed ? '8 6' : undefined
    }

    /** Build the SVG path `d` string used for the hit-area, selection-outline, and visible-stroke paths. */
    abstract buildPath(x1: number, y1: number, x2: number, y2: number, invert: boolean): string

    /** A point lying on the path from `buildPath`, used to position the delete marker. */
    abstract getMidpoint(x1: number, y1: number, x2: number, y2: number, invert: boolean): Vector2

    /**
     * Optional Vue component that fully replaces the default hit-area/selection-outline/
     * visible-stroke/delete-marker rendering for connections of this type. Receives
     * `ConnectionRenderProps` and may `inject('board')` itself to drive selection/deletion.
     */
    render?: Component
}
