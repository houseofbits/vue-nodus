<template>
  <button
    @click="audioEngine.power()"
    class="h-10 px-4 flex items-center gap-2
           rounded-xl
           text-white
           shadow-md shadow-black/10
           active:scale-95
           transition-all duration-150"
    :class="audioEngine.state.running ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-gray-900 hover:bg-gray-800'"
    :title="audioEngine.state.running ? 'Stop' : 'Play'"
  >
    <svg v-if="audioEngine.state.running" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="6" width="12" height="12" rx="1" />
    </svg>
    <svg v-else class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
    <span class="text-sm font-medium">{{ audioEngine.state.running ? 'Stop' : 'Play' }}</span>
  </button>
</template>

<script setup lang="ts">
import { audioEngine } from '../audio/AudioEngine'
</script>
