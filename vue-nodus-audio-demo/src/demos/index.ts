import musicPatch from './musicPatch.json'
import groovePatch from './groovePatch.json'
import dronePatch from './dronePatch.json'

export interface Preset {
    id: string
    label: string
    data: any
}

export const BLANK_BOARD = {
    nodes: {},
    connections: {},
    board: { panX: 0, panY: 0, zoom: 1 },
}

export const presets: Preset[] = [
    { id: 'music', label: 'Music — sequenced groove', data: musicPatch },
    { id: 'groove', label: 'Groove — arp, bass & drums', data: groovePatch },
    { id: 'drone', label: 'Drone — mixer + LFO filter', data: dronePatch },
    { id: 'new', label: 'New — blank board', data: BLANK_BOARD },
]
