<template>
  <div class="container mx-auto m-6">
    <div v-if="loading" class="text-center text-gray-500">Loading preview rooms...</div>
    <div v-else-if="error" class="text-center text-red-500">{{ error }}</div>
    <div v-else class="flex flex-wrap justify-center items-center gap-6">
      <div
        v-for="room in rooms"
        :key="room.id"
        class="flex-none"
      >
        <RoomItem :room="room" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import RoomItem from './RoomItem.vue';
import type { Room } from '~/types/room';

const rooms = ref<Room[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    // Fetch preview rooms from the backend
    const response = await fetch('http://localhost:3001/welcome-rooms');
    if (!response.ok) throw new Error('Failed to fetch');
    const data: Room[] = await response.json();
    rooms.value = data;
  } catch (err) {
    error.value = (err as Error).message || 'An unknown error occurred.';
  } finally {
    loading.value = false;
  }
});
</script>
