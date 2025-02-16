<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-2xl text-center font-bold m-8">Nedávno pridané</h1>
    <div v-if="loading" class="text-center text-gray-500">Loading preview properties...</div>
    <div v-else-if="error" class="text-center text-red-500">{{ error }}</div>
    <div v-else class="m-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <PropertyItem
        v-for="property in properties"
        :key="property._id"
        :property="property"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface Property {
  _id: string;
  title: string;
  fullDescription: string;
  price: string;
  images: string[];
}

const properties = ref<Property[]>([]); // Explicitly typed as an array of Property objects
const loading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    // Fetch preview properties from the backend
    const response = await fetch('http://localhost:3001/preview-properties');
    if (!response.ok) throw new Error('Failed to fetch preview properties');

    const data: Property[] = await response.json(); // Type the response as Property[]
    properties.value = data;
  } catch (err) {
    error.value = (err as Error).message || 'An unknown error occurred.';
  } finally {
    loading.value = false;
  }
});
</script>

