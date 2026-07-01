<template>
  <div class="relative inline-block" ref="root">
    <!-- Floating Action Button -->
    <button
      @click="open = !open"
      class="w-10 h-10 flex items-center justify-center
             rounded-xl
             bg-gray-900 text-white
             shadow-md shadow-black/10
             hover:bg-gray-800 active:scale-95
             transition-all duration-150"
      title="Create node"
    >
      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-width="2" stroke-linecap="round" d="M12 5v14M5 12h14" />
      </svg>
    </button>

    <!-- Dropdown -->
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
      <!-- Search -->
      <div class="p-2 bg-gray-50 border-b border-gray-200">
        <input
          v-model="query"
          autofocus
          type="text"
          placeholder="Search nodes..."
          class="w-full px-3 py-2 text-sm
                 rounded-lg
                 bg-white
                 border border-gray-200
                 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400
                 transition"
        />
      </div>

      <!-- Items -->
      <ul class="max-h-64 overflow-auto py-1">
        <li
          v-for="item in filteredItems"
          :key="item.value"
          @click="select(item)"
          class="px-3 py-2.5 text-sm
                 cursor-pointer
                 mx-1 rounded-lg
                 hover:bg-gray-100
                 active:bg-gray-200
                 transition"
        >
          <span class="font-medium text-gray-800">
            {{ item.label }}
          </span>
        </li>

        <li
          v-if="filteredItems.length === 0"
          class="px-3 py-3 text-sm text-gray-400 text-center"
        >
          No matching nodes
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";

type Item = {
  label: string;
  value: string;
};

const props = defineProps<{
  items: Item[];
}>();

const emit = defineEmits<{
  (e: "select", item: Item): void;
}>();

const open = ref(false);
const query = ref("");

const root = ref<HTMLElement | null>(null);

    const filteredItems = computed(() => {
  if (!query.value) return props.items;

  return props.items.filter(i =>
    i.label.toLowerCase().includes(query.value.toLowerCase())
  );
});

function select(item: Item) {
  emit("select", item);
  open.value = false;
  query.value = "";
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