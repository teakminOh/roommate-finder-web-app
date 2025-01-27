<template>
  <div>
    <!-- Loading State -->
    <div v-if="loading" class="text-center text-gray-500">Loading properties...</div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center text-red-500">{{ error }}</div>

    <!-- Property Listings -->
    <div id="list" v-else class="scrollable-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
      <PropertyItem
        v-for="property in properties"
        :key="property._id"
        :property="property"
      />
    </div>

    <!-- Pagination -->
    <Pagination
      :current-page="currentPage"
      :total-pages="totalPages"
      @change-page="fetchPage"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import Pagination from './Pagination.vue';

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
    const url = new URL('http://localhost:3001/properties');
    url.searchParams.append('limit', '10');
    url.searchParams.append('skip', String((page - 1) * 10));

    // Add the address parameter only if it exists
    if (address) {
      url.searchParams.append('address', address);
    }

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Failed to fetch properties');

    const data = await response.json();
    properties.value = data.properties || [];
    totalPages.value = data.totalPages || 0;
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
