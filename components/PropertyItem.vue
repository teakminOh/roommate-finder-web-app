<template>
  <div>
    <div
      class="bg-white p-4 rounded-md shadow-md hover:shadow-lg transition-shadow duration-300 relative cursor-pointer"
      @mouseenter="showArrows = true"
      @mouseleave="showArrows = false"
      @click="isModalOpen = true"
    >
      <!-- Display Current Image or Fallback -->
      <div class="relative">
        <img
          :src="props.property.images && props.property.images.length > 0 ? props.property.images[currentImageIndex] : '/images/placeholder.jpg'"
          alt="Property Image"
          class="w-full h-64 object-cover rounded-md mb-2"
        />
        
        <!-- Navigation Arrows -->
        <button
          v-if="showArrows && props.property.images.length > 1"
          @click.stop="prevImage"
          class="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-1 rounded-full hover:bg-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M12.707 14.707a1 1 0 01-1.414 0L7 10.414a1 1 0 010-1.414l4.293-4.293a1 1 0 011.414 1.414L9.414 10l3.293 3.293a1 1 0 010 1.414z" clip-rule="evenodd" />
          </svg>
        </button>

        <button
          v-if="showArrows && props.property.images.length > 1"
          @click.stop="nextImage"
          class="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-1 rounded-full hover:bg-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4.293 4.293a1 1 0 010 1.414l-4.293 4.293a1 1 0 01-1.414 0z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>

      <h2 class="text-lg font-bold">{{ props.property.title }}</h2>
      <p class="text-gray-700 text-sm">
        {{ truncateText(props.property.fullDescription, 100) }}
      </p>
      <p class="text-blue-500 font-semibold">{{ props.property.price }}</p>
    </div>

    <!-- Use the PropertyModal component -->
    <PropertyModal
      :property="props.property"
      :is-open="isModalOpen"
      @close="isModalOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Property {
  title: string;
  fullDescription: string;
  price: string;
  images: string[];
}

const props = defineProps<{
  property: Property;
}>();

const currentImageIndex = ref(0);
const showArrows = ref(false);
const isModalOpen = ref(false);

// Helper function to truncate text
const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// Navigate to the previous image
const prevImage = () => {
  currentImageIndex.value =
    (currentImageIndex.value - 1 + props.property.images.length) % props.property.images.length;
};

// Navigate to the next image
const nextImage = () => {
  currentImageIndex.value = (currentImageIndex.value + 1) % props.property.images.length;
};
</script>

<style scoped>
/* Add hover effects for arrows */
button {
  transition: background-color 0.3s ease;
}
</style>
