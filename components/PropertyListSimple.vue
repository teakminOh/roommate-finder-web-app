<template>
    <div>
      <!-- Loading State -->
      <div v-if="loading" class="text-center text-gray-500">Loading properties...</div>
  
      <!-- Error State -->
      <div v-else-if="error" class="text-center text-red-500">{{ error }}</div>
  
      <!-- Property Listings -->
      <div id="list" v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        <PropertyItem
          v-for="property in properties"
          :key="property._id"
          :property="property"
        />
      </div>
  
      <!-- Pagination Component -->
      <Pagination
        v-if="totalPages > 1"
        :totalPages="totalPages"
        :currentPage="currentPage"
        @pageChanged="fetchPage"
      />
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { useRoute } from 'vue-router';
  
  interface Property {
    _id: string;
    title: string;
    fullDescription: string;
    price: string;
    images: string[];
  }
  
  const properties = ref<Property[]>([]);
  const totalPages = ref(0);
  const currentPage = ref(1);
  const loading = ref(true);
  const error = ref<string | null>(null);
  
  const route = useRoute();
  const address = (route.query.address as string) || '';
  
  const fetchPage = async (page: number) => {
    loading.value = true;
    currentPage.value = page;
  
    try {
      const skip = (page - 1) * 10; // Calculate the skip value
      let url = `http://localhost:3001/properties?limit=10&skip=${skip}`;
  
      if (address) {
        url += `&address=${encodeURIComponent(address)}`;
      }
  
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch properties');
  
      const data = await response.json();
      properties.value = data.properties || [];
      totalPages.value = data.totalPages || 0; // Update total pages
    } catch (err) {
      error.value = (err as Error).message || 'An unknown error occurred.';
    } finally {
      loading.value = false;
    }
  };
  
  // Fetch the first page on mounted
  onMounted(() => {
    fetchPage(1);
  });
  </script>
  
  <style scoped>
  /* Add any custom styles if needed */
  </style>
  