<template>
  <div class="relative inline-block" ref="root">
    <button
      @click="open = !open"
      class="w-10 h-10 flex items-center justify-center
             rounded-xl
             bg-gray-900 text-white
             shadow-md shadow-black/10
             hover:bg-gray-800 active:scale-95
             transition-all duration-150"
      title="Load example"
    >
      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" stroke-width="2" />
        <circle cx="18" cy="16" r="3" stroke-width="2" />
      </svg>
    </button>

    <div
      v-if="open"
      class="absolute mt-2 w-72
             rounded-xl
             border border-gray-200
             bg-white
             shadow-xl
             overflow-hidden
             animate-in fade-in zoom-in-95"
    >
      <ul class="max-h-64 overflow-auto py-1">
        <li
          v-for="preset in props.presets"
          :key="preset.id"
          @click="select(preset)"
          class="px-3 py-2.5 text-sm
                 cursor-pointer
                 mx-1 rounded-lg
                 hover:bg-gray-100
                 active:bg-gray-200
                 transition"
        >
          <span class="font-medium text-gray-800">
            {{ preset.label }}
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import type { Preset } from "../demos";

const props = defineProps<{
  presets: Preset[];
}>();

const emit = defineEmits<{
  (e: "select", preset: Preset): void;
}>();

const open = ref(false);
const root = ref<HTMLElement | null>(null);

function select(preset: Preset) {
  emit("select", preset);
  open.value = false;
}

/* close on outside click */
function onClick(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) {
    open.value = false;
  }
}

onMounted(() => window.addEventListener("click", onClick));
onBeforeUnmount(() => window.removeEventListener("click", onClick));
</script>
