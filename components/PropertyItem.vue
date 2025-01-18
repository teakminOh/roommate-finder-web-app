<template>
  <li class="border p-4 mb-2 bg-white rounded shadow">
    <h3 class="font-bold text-lg text-blue-900">{{ property.title }}</h3>
    <p class="text-gray-700">{{ property.location }}</p>
    <p class="text-gray-500">{{ property.price }}</p>
    <div class="mt-2">
      <button
        class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
        @click="handleViewDetails"
      >
        View Details
      </button>
    </div>
  </li>
</template>

<script setup>
defineProps({
  property: {
    type: Object,
    required: true,
  },
});

const handleViewDetails = () => {
  // Implement logic to view detailed information about the property
  alert(`Viewing details for: ${property.title}`);
};
</script>

<style scoped>
/* Add your styles here */
</style>
