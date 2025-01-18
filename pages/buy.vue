<template>
  <div class="flex h-screen">
    <!-- Left: Listings -->
    <div class="w-1/2 p-4 overflow-y-auto bg-gray-100">
      <div v-if="loading" class="text-center text-gray-500">Loading properties...</div>
      <div v-else-if="error" class="text-red-500">Error: {{ error }}</div>
      <div v-else-if="properties.length === 0" class="text-center text-gray-500">
        No properties found for the address: "{{ address }}"
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Display properties -->
        <div
          v-for="property in properties"
          :key="property.id"
          class="bg-white p-4 rounded-md shadow-md"
        >
          <h2 class="text-lg font-bold">{{ property.address }}</h2>
          <p>{{ property.description }}</p>
          <p class="text-blue-500 font-semibold">{{ formatCurrency(property.price) }}</p>
        </div>
      </div>
    </div>

    <!-- Right: Map -->
    <div class="w-1/2">
      <Map />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

// Define the page meta
definePageMeta({
  layout: "buy",
});

// Get the address from the query parameter
const route = useRoute();
const address = (route.query.address as string) || '';

// Define the property interface
interface Property {
  id: number;
  address: string;
  description: string;
  price: number;
}

// State variables
const properties = ref<Property[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

// Fetch properties from the backend
onMounted(async () => {
  try {
    const response = await fetch(`/properties?address=${encodeURIComponent(address)}`);
    if (!response.ok) throw new Error('Failed to fetch properties');
    properties.value = await response.json();
  } catch (err) {
    error.value = (err as Error).message || 'Unknown error';
  } finally {
    loading.value = false;
  }
});

// Currency formatter function
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
};
</script>

<style scoped>
/* Add any specific styles */
</style>
