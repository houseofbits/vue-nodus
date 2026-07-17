import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import VGraph from '../components/VGraph.vue'
import { NodusBoard } from '../models'

describe('VGraph', () => {
    it('shows the default grid and an empty background layer when no options are given', () => {
        const board = new NodusBoard()
        const wrapper = mount(VGraph, { props: { board } })

        expect(wrapper.classes()).toContain('grid')
        expect(wrapper.find('.background-layer').exists()).toBe(true)
        expect(wrapper.find('.background-layer').element.children.length).toBe(0)
    })

    it('hides the grid class when #background slot content is provided', () => {
        const board = new NodusBoard()
        const wrapper = mount(VGraph, {
            props: { board },
            slots: { background: '<div class="custom-bg" />' },
        })

        expect(wrapper.classes()).not.toContain('grid')
    })

    it('renders #background slot content inside .background-layer, before the connections layer', () => {
        const board = new NodusBoard()
        const wrapper = mount(VGraph, {
            props: { board },
            slots: { background: '<div class="custom-bg" />' },
        })

        const backgroundLayer = wrapper.find('.background-layer')
        expect(backgroundLayer.find('.custom-bg').exists()).toBe(true)

        const children = Array.from(wrapper.element.children) as Element[]
        const backgroundIndex = children.indexOf(backgroundLayer.element)
        const connectionsIndex = children.findIndex((el) => el.tagName === 'svg')

        expect(backgroundIndex).toBeLessThan(connectionsIndex)
    })

    it('passes panX, panY and zoom to the #background slot', () => {
        const board = new NodusBoard()
        board.view.viewport.state.panX = 12
        board.view.viewport.state.panY = -34
        board.view.viewport.state.zoom = 1.5

        const wrapper = mount(VGraph, {
            props: { board },
            slots: {
                background: `
                    <template #background="{ panX, panY, zoom }">
                        <div class="custom-bg">{{ panX }},{{ panY }},{{ zoom }}</div>
                    </template>
                `,
            },
        })

        expect(wrapper.find('.custom-bg').text()).toBe('12,-34,1.5')
    })
})
