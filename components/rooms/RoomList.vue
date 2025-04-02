<template>
  <div class="mt-20">
    <!-- Loading State -->
    <div v-if="loading" class="text-center text-gray-500">
      Načítavam izby...
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center text-red-500">
      {{ error }}
    </div>

    <div
      v-else
      id="list"
      class="flex items-center flex-wrap gap-6"
    >
      <div
        v-for="room in rooms"
        :key="room.id"
        class="flex-none"
      >
        <RoomItem :room="room" />
      </div>
    </div>



    <!-- Pagination Controls -->
    <div class="flex items-center justify-center space-x-4 mt-4">
      <button
        @click="goToPreviousPage"
        :disabled="currentPage === 1"
        class="px-3 py-1 border rounded disabled:opacity-50"
      >
        Previous
      </button>
      <span>Page {{ currentPage }}</span>
      <button
        @click="goToNextPage"
        :disabled="!hasNextPage"
        class="px-3 py-1 border rounded disabled:opacity-50"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import type { Room } from '~/types/room';
import RoomItem from './RoomItem.vue';

const rooms = ref<Room[]>([]);
const currentPage = ref(1);
const loading = ref(true);
const error = ref<string | null>(null);
// Flag to indicate if there is a next page based on the API response.
const hasNextPage = ref(false);

// Object to store pagination cursors for each page.
// For page 1, no cursor is needed.
const pageTokens = ref<Record<number, string | null>>({ 1: null });

const route = useRoute();
const address = (route.query.address as string) || '';

const fetchPage = async (page: number) => {
  loading.value = true;
  error.value = null;
  currentPage.value = page;

  try {
    const url = new URL('http://localhost:3001/rooms');
    url.searchParams.append('limit', '10');

    // For pages greater than 1, use the stored cursor from the previous page.
    if (page > 1) {
      // Use the token stored for this page if available,
      // otherwise fall back to the token from the previous page.
      const token = pageTokens.value[page] || pageTokens.value[page - 1];
      if (token) {
        url.searchParams.append('lastDocId', token);
      }
    }

    // Optionally include the address parameter.
    if (address) {
      url.searchParams.append('address', address);
    }

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Failed to fetch rooms');

    const data = await response.json();
    rooms.value = data.rooms || [];

    // If a nextPageToken is provided, store it for the next page.
    if (data.nextPageToken) {
      pageTokens.value[page + 1] = data.nextPageToken;
      hasNextPage.value = true;
    } else {
      hasNextPage.value = false;
    }
  } catch (err) {
    error.value =
      (err as Error).message || 'An unknown error occurred.';
  } finally {
    loading.value = false;
  }
};

const goToNextPage = () => {
  if (hasNextPage.value) {
    fetchPage(currentPage.value + 1);
  }
};

const goToPreviousPage = () => {
  if (currentPage.value > 1) {
    fetchPage(currentPage.value - 1);
  }
};

onMounted(() => {
  fetchPage(1);
});
</script>
