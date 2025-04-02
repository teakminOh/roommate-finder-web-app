<template>
  <div class="container mx-auto m-6 mt-16">
    <!-- <h1 class="text-2xl text-center font-bold m-8">Nájdi si domov!</h1> -->
    <div v-if="loading" class="text-center text-gray-500">Loading preview roommates...</div>
    <div v-else-if="error" class="text-center text-red-500">{{ error }}</div>
    <div v-else class="flex flex-wrap justify-center items-center gap-6">
      <div
        v-for="roommate in roommates"
        :key="roommate.id"
        class="flex-none"
      >
        <RoommateItem :roommate="roommate" />
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import RoommateItem from './RoommateItem.vue';
import type { Roommate } from '~/types/user';

const roommates = ref<Roommate[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    // Fetch preview roommates from the backend
    const response = await fetch('http://localhost:3001/welcome-users');
    if (!response.ok) throw new Error('Failed to fetch');

    const data: Roommate[] = await response.json();
    roommates.value = data;
  } catch (err) {
    error.value = (err as Error).message || 'An unknown error occurred.';
  } finally {
    loading.value = false;
  }
});
</script>
