<template>
  <div class="flex items-center gap-2" ref="root">
    <button
      @click="history.undo()"
      :disabled="!history.canUndo()"
      class="w-10 h-10 flex items-center justify-center
             rounded-xl
             bg-gray-900 text-white
             shadow-md shadow-black/10
             transition-all duration-150"
      :class="history.canUndo() ? 'hover:bg-gray-800 active:scale-95' : 'opacity-40 cursor-not-allowed'"
      title="Undo"
    >
      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9 14 4 9l5-5" />
        <path stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
      </svg>
    </button>

    <button
      @click="history.redo()"
      :disabled="!history.canRedo()"
      class="w-10 h-10 flex items-center justify-center
             rounded-xl
             bg-gray-900 text-white
             shadow-md shadow-black/10
             transition-all duration-150"
      :class="history.canRedo() ? 'hover:bg-gray-800 active:scale-95' : 'opacity-40 cursor-not-allowed'"
      title="Redo"
    >
      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m15 14 5-5-5-5" />
        <path stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
      </svg>
    </button>

    <div class="relative inline-block">
      <button
        @click="open = !open"
        class="w-10 h-10 flex items-center justify-center
               rounded-xl
               bg-gray-900 text-white
               shadow-md shadow-black/10
               hover:bg-gray-800 active:scale-95
               transition-all duration-150"
        title="History"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 8v5l3 2" />
          <path stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M3.5 9A8.5 8.5 0 1 1 5 15.5" />
          <path stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M3.5 5v4h4" />
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
            v-for="(entry, index) in reversedRecords"
            :key="index"
            class="px-3 py-2.5 text-sm"
          >
            <span class="font-medium text-gray-800">
              {{ entry.label }}
            </span>
          </li>

          <li
            v-if="reversedRecords.length === 0"
            class="px-3 py-3 text-sm text-gray-400 text-center"
          >
            No history yet
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import type { NodusHistory } from "@houseofbits/vue-nodus";

const props = defineProps<{
  history: NodusHistory;
}>();

const open = ref(false);
const root = ref<HTMLElement | null>(null);

const reversedRecords = computed(() => [...props.history.records].reverse());

/* close on outside click */
function onClick(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) {
    open.value = false;
  }
}

onMounted(() => window.addEventListener("click", onClick));
onBeforeUnmount(() => window.removeEventListener("click", onClick));
</script>
