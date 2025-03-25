<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-2xl text-center font-bold m-8">Nájdi si spolubývajúceho!</h1>
    <div v-if="loading" class="text-center text-gray-500">Loading preview roommates...</div>
    <div v-else-if="error" class="text-center text-red-500">{{ error }}</div>
    <div v-else class="m-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <RoommateItem
        v-for="roommate in roommates"
        :key="roommate.id"
        :roommate="roommate"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import RoommateItem from './RoommateItem.vue';

interface Roommate {
  id: string;
  firstName: string;
  age: string;
  bio: string;
  budget: string;
  location: string;
  student: boolean;
  gender: string;
  images: string[];
}

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
