<template>
  <div v-if="totalPages > 1" class="flex justify-center mt-4">
    <!-- Previous Button -->
    <button
      v-if="currentPage > 1"
      @click="fetchPreviousPage"
      class="px-4 py-2 mx-1 rounded text-blue-600 hover:bg-blue-100 transition"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
    </button>

    <!-- Page Numbers -->
    <button
      v-for="page in visiblePages"
      :key="page"
      @click="emitChangePage(page)"
      :class="[
        'px-4 py-2 mx-1 rounded',
        currentPage === page ? 'text-blue-600 font-bold' : 'hover:bg-blue-100',
      ]"
    >
      {{ page }}
    </button>

    <!-- Next Button -->
    <button
      v-if="currentPage < totalPages"
      @click="fetchNextPage"
      class="px-4 py-2 mx-1 rounded text-blue-600 hover:bg-blue-100 transition"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// Define props
const props = defineProps({
  currentPage: {
    type: Number,
    required: true,
  },
  totalPages: {
    type: Number,
    required: true,
  },
});

// Emit function
const emit = defineEmits(['change-page']);

// Computed property to determine visible pages
const visiblePages = computed(() => {
  const range = 3; // Number of pages to show before and after the current page
  const startPage = Math.max(1, props.currentPage - range);
  const endPage = Math.min(props.totalPages, props.currentPage + range);

  return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
});

// Emit the change-page event
const emitChangePage = (page: number) => {
  if (page >= 1 && page <= props.totalPages) {
    emit('change-page', page);
  }
};

// Fetch the next page
const fetchNextPage = () => {
  const nextPage = props.currentPage + 1;
  if (nextPage <= props.totalPages) {
    emitChangePage(nextPage);
  }
};

// Fetch the previous page
const fetchPreviousPage = () => {
  const previousPage = props.currentPage - 1;
  if (previousPage >= 1) {
    emitChangePage(previousPage);
  }
};
</script>
