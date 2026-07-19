<script setup lang="ts">
import { NodusBoard, VGraph, NodusBaseNode } from '@houseofbits/vue-nodus'
import VOscillatorNode from './components/VOscillatorNode.vue'
import OscillatorSourceNode from './models/OscillatorSourceNode.ts'
import VLfoNode from './components/VLfoNode.vue'
import LfoSourceNode from './models/LfoSourceNode.ts'
import VGainNode from './components/VGainNode.vue'
import GainControlNode from './models/GainControlNode.ts'
import VMixerNode from './components/VMixerNode.vue'
import MixerControlNode from './models/MixerControlNode.ts'
import VFilterNode from './components/VFilterNode.vue'
import BiquadFilterControlNode from './models/BiquadFilterControlNode.ts'
import VDelayNode from './components/VDelayNode.vue'
import DelayControlNode from './models/DelayControlNode.ts'
import VAnalyserNode from './components/VAnalyserNode.vue'
import AnalyserDisplayNode from './models/AnalyserDisplayNode.ts'
import VAudioOutputNode from './components/VAudioOutputNode.vue'
import AudioOutputNode from './models/AudioOutputNode.ts'
import VSequencerNode from './components/VSequencerNode.vue'
import StepSequencerNode from './models/StepSequencerNode.ts'
import VClockNode from './components/VClockNode.vue'
import ClockNode from './models/ClockNode.ts'
import VClockDelayNode from './components/VClockDelayNode.vue'
import ClockDelayNode from './models/ClockDelayNode.ts'
import VNoiseNode from './components/VNoiseNode.vue'
import NoiseSourceNode from './models/NoiseSourceNode.ts'
import VEnvelopeNode from './components/VEnvelopeNode.vue'
import EnvelopeControlNode from './models/EnvelopeControlNode.ts'
import VBlendNode from './components/VBlendNode.vue'
import BlendControlNode from './models/BlendControlNode.ts'
import VCompressorNode from './components/VCompressorNode.vue'
import CompressorControlNode from './models/CompressorControlNode.ts'
import VWaveshaperNode from './components/VWaveshaperNode.vue'
import WaveshaperControlNode from './models/WaveshaperControlNode.ts'
import VPannerNode from './components/VPannerNode.vue'
import PannerControlNode from './models/PannerControlNode.ts'
import VAudioToolbar from './components/VAudioToolbar.vue'
import VNodeSelector from './components/VNodeSelector.vue'
import VHistoryToolbar from './components/VHistoryToolbar.vue'
import VPresetSelector from './components/VPresetSelector.vue'
import { audioEngine } from './audio/AudioEngine.ts'
import { presets, type Preset } from './demos/index.ts'

const board = new NodusBoard()

board.registerComponent('Oscillator', VOscillatorNode)
board.registerComponent('Lfo', VLfoNode)
board.registerComponent('Gain', VGainNode)
board.registerComponent('Mixer', VMixerNode)
board.registerComponent('Filter', VFilterNode)
board.registerComponent('Delay', VDelayNode)
board.registerComponent('Analyser', VAnalyserNode)
board.registerComponent('Output', VAudioOutputNode)
board.registerComponent('Sequencer', VSequencerNode)
board.registerComponent('Clock', VClockNode)
board.registerComponent('ClockDelay', VClockDelayNode)
board.registerComponent('Noise', VNoiseNode)
board.registerComponent('Envelope', VEnvelopeNode)
board.registerComponent('Blend', VBlendNode)
board.registerComponent('Compressor', VCompressorNode)
board.registerComponent('Waveshaper', VWaveshaperNode)
board.registerComponent('Panner', VPannerNode)

const registry: Record<string, new () => any> = {
  OscillatorSourceNode,
  LfoSourceNode,
  GainControlNode,
  MixerControlNode,
  BiquadFilterControlNode,
  DelayControlNode,
  AnalyserDisplayNode,
  AudioOutputNode,
  StepSequencerNode,
  ClockNode,
  ClockDelayNode,
  NoiseSourceNode,
  EnvelopeControlNode,
  BlendControlNode,
  CompressorControlNode,
  WaveshaperControlNode,
  PannerControlNode,
}

const items = [
  { label: 'Oscillator', value: 'OscillatorSourceNode' },
  { label: 'LFO', value: 'LfoSourceNode' },
  { label: 'Gain', value: 'GainControlNode' },
  { label: 'Mixer', value: 'MixerControlNode' },
  { label: 'Filter', value: 'BiquadFilterControlNode' },
  { label: 'Delay', value: 'DelayControlNode' },
  { label: 'Analyser', value: 'AnalyserDisplayNode' },
  { label: 'Output', value: 'AudioOutputNode' },
  { label: 'Sequencer', value: 'StepSequencerNode' },
  { label: 'Clock', value: 'ClockNode' },
  { label: 'Clock Delay', value: 'ClockDelayNode' },
  { label: 'Noise', value: 'NoiseSourceNode' },
  { label: 'Envelope', value: 'EnvelopeControlNode' },
  { label: 'Blend', value: 'BlendControlNode' },
  { label: 'Compressor', value: 'CompressorControlNode' },
  { label: 'Waveshaper', value: 'WaveshaperControlNode' },
  { label: 'Panner', value: 'PannerControlNode' },
]

function createNodeManually(nodeClass: string) {
  const NodeClass = registry[nodeClass]
  if (!NodeClass) throw new Error(`Unknown node class: ${nodeClass}`)

  const node = new NodeClass()

  const center = board.view.getBoardCenterPosition()
  node.setPosition(center.x, center.y)

  board.graph.addNode(node)
}

function createNode(_componentId: string, data: any): NodusBaseNode {
  const NodeClass = registry[data.nodeClass]
  if (!NodeClass) throw new Error(`Unknown node class: ${data.nodeClass}`)

  return new NodeClass()
}

function loadPreset(preset: Preset) {
  board.history.snapshot(`Loaded "${preset.label}"`)
  board.serializer.deserialize(preset.data, createNode)
}

audioEngine.attach(board)
board.serializer.deserialize(presets[0].data, createNode)

board.history.setNodeFactory(createNode)

</script>

<template>
  <VGraph :board="board" />
  <div class="absolute top-2 left-2 flex items-center gap-2">
    <VAudioToolbar />
    <VPresetSelector :presets="presets" @select="loadPreset" />
    <VNodeSelector :items="items" @select="(item) => createNodeManually(item.value)" />
    <VHistoryToolbar :history="board.history" />
  </div>
</template>
