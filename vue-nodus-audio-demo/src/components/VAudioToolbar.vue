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
    :title="audioEngine.state.running ? 'Power off' : 'Power on'"
  >
    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path stroke-width="2" stroke-linecap="round" d="M12 3v9" />
      <path stroke-width="2" stroke-linecap="round" d="M6.2 6.2a8 8 0 1 0 11.6 0" />
    </svg>
    <span class="text-sm font-medium">{{ audioEngine.state.running ? 'On' : 'Off' }}</span>
  </button>
</template>

<script setup lang="ts">
import { audioEngine } from '../audio/AudioEngine'
</script>
