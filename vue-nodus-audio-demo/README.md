# vue-nodus-audio-demo

A modular-synth playground built on [`@houseofbits/vue-nodus`](../vue-nodus) and the Web Audio API. The visual node graph *is* the audio graph: every cable you draw calls `AudioNode.connect()` on real Web Audio nodes, so you can patch oscillators, filters, sequencers, and effects together and hear the result live.

## Running

From the repository root:

```bash
npm install
npm run build        # build the vue-nodus library first (the demo consumes dist/)
npm run audio:dev    # start the dev server
```

Then open the printed URL and press the **Power** button — the default preset plays a sequenced bassline with hi-hats. Use the note icon to switch examples and the **+** icon to add nodes.

> Browsers block audio until a user gesture. The Power button resumes the shared `AudioContext` (and doubles as a global start/stop). Chrome may auto-resume the context on your first click anywhere in the page.

## How it works

### Graph → audio mapping

- **`src/audio/AudioEngine.ts`** owns one eagerly-created (suspended) `AudioContext` and a master gain into `context.destination`. Node models create their native `AudioNode`s in their constructors, so presets are fully wired before the first gesture. The engine also watches the board's reactive node map and calls `dispose()` on removed model instances — which is what makes deletion, undo/redo, and preset switching tear down and rebuild the native audio graph automatically.
- **`src/models/AudioBaseNode.ts`** is the base class for every audio node. It implements `onPortConnected` / `onPortDisconnected` once: when an `"audio"`-typed input port gains or loses a connection, it connects/disconnects the neighbor's native output to this node's native input. Subclasses only declare *which* natives sit behind each port:

  ```ts
  abstract getAudioOutput(port: NodusPort): AudioNode | null
  abstract getAudioInputTarget(port: NodusPort): AudioNode | AudioParam | null
  ```

  Native instances are never stored in port values (those are serialized); they are exchanged through these accessors at connect time.

### Port conventions

There is a single port type, `"audio"`, distinguished by color:

- **Emerald** ports carry audio signal (`AudioNode` targets).
- **Amber** ports are parameter-modulation points (`AudioParam` targets) — `AudioNode.connect()` accepts both, so any output can drive any parameter, modular-synth style.

All inputs are multiports: the Web Audio API sums simultaneous connections, so fan-in mixes for free (and one output can fan out to many inputs).

### Sequencing

`StepSequencerNode` outputs two `ConstantSourceNode`s: **pitch out** (absolute note frequency in Hz) and **gate out** (a 0→level envelope per active step). Steps are scheduled on the audio clock with the standard lookahead pattern (a 25 ms JS timer schedules everything 100 ms ahead), and the envelope uses only chained `setTargetAtTime` segments, which are click-free by construction.

To play notes: wire *pitch out* into an Oscillator's `freq mod` and set the oscillator's own Frequency to 0; wire *gate out* into a Gain's `gain mod` and leave the Gain slider at 0 — the Gain node becomes the note envelope. Sequencers restart from step 0 whenever the context resumes, so multiple lanes at the same (or 2:1) BPM stay in lockstep.

## Node reference

| Node | Wraps | Notes |
|---|---|---|
| Oscillator | `OscillatorNode` | Waveform, log frequency slider (20–2000 Hz), detune. Set Frequency to 0 when a sequencer drives the pitch. |
| LFO | `OscillatorNode` → depth `GainNode` | Slow oscillator (0.1–20 Hz) scaled by ±depth; feed it to any amber port. |
| Sequencer | 2× `ConstantSourceNode` | 8 steps, BPM/Level/Gate/Attack/Release, pitch + gate outputs, playhead highlight. |
| Noise | looping `AudioBufferSourceNode` | White noise source for percussion. |
| Gain | `GainNode` | Level control; with the slider at 0 and a gate on `gain mod` it acts as an envelope. |
| Mixer | 4× (`GainNode` → `StereoPannerNode`) → `GainNode` | Four channels with level + pan, summed to one output. |
| Filter | `BiquadFilterNode` | Lowpass/highpass/bandpass/notch/peaking, log frequency, Q, `freq mod` input. |
| Delay | `DelayNode` + feedback `GainNode` | Wet-only echo, 0–2 s, feedback 0–0.9. |
| Envelope | `ConstantSourceNode` | Manually-triggered ADSR; trigger pad, output feeds any amber port (e.g. a Gain's `gain mod`). |
| Blend | 2× `GainNode` → `GainNode` | Equal-power crossfade between two signals, A at 0 / B at 1. |
| Compressor | `DynamicsCompressorNode` | Threshold/knee/ratio/attack/release. |
| Waveshaper | `WaveShaperNode` → `GainNode` | Drive-controlled distortion curve, output level. |
| Panner | `StereoPannerNode` | Stereo pan, `pan mod` input. |
| Analyser | `AnalyserNode` | Pass-through oscilloscope drawn on a canvas. |
| Output | `GainNode` → master | Volume into the engine's master output. Terminal node. |

## Presets (`src/demos/`)

- **Music — sequenced groove**: pentatonic bassline through two detuned oscillators, mixer, LFO-swept lowpass, plus a noise hi-hat lane.
- **Groove — arp, bass & drums**: four sequencer lanes — square-wave arpeggio with a ping-pong echo (Delay), filtered saw bass at half tempo, gated-sine kick, offbeat hats.
- **Drone — mixer + LFO filter**: no sequencing; two oscillators mixed L/R through an LFO-swept filter.
- **Nightdrive — new nodes showcase**: driven bass (Waveshaper), a saw+square lead blended through Blend then echoed and auto-panned (Delay, Panner + LFO), four-on-the-floor kick and offbeat hats, all glued by a Compressor on the master bus — plus a manually-triggered pad (Envelope) summed in alongside the mix. Click the pad's "Trigger" button and hold to play it.
- **New — blank board**: empty canvas to patch from scratch.

Presets are plain serializer JSON registered in `src/demos/index.ts`; switching is undoable (a history snapshot is taken before each load). To author one, build a patch in the app, run `JSON.stringify(board.serializer.serialize())` in the console, and save the result.

## Project layout

```
src/
  audio/AudioEngine.ts      shared AudioContext, power toggle, dispose watcher
  models/                   node model classes (AudioBaseNode + one per node type)
  components/               V*.vue renderers, toolbar, preset/node selectors
  demos/                    preset JSON files + registry
```
