<template>
  <div 
    class="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-lg hover:shadow-2xl relative cursor-pointer w-96"
    @mouseenter="showArrows = true"
    @mouseleave="showArrows = false"
    @click="isModalOpen = true"
  >
    <!-- Favorite Button -->
    <FavoriteRoom
      v-model="favoriteStatus"
      :room="props.room"
      class="absolute top-3 right-3 z-10"
    />

    <!-- Image Carousel -->
    <div class="relative">
      <!-- Main Image with Loading State -->
      <div class="relative w-full h-64 bg-gray-200 rounded-t-xl overflow-hidden">
        <img
          :src="props.room.images && props.room.images.length > 0 ? props.room.images[currentImageIndex] : '/images/placeholder.jpg'"
          alt="Room Image"
          class="w-full h-64 object-cover rounded-t-xl transition-opacity duration-300"
          :class="{ 'opacity-0': imageLoading }"
          @load="imageLoading = false"
          @loadstart="imageLoading = true"
        />
        
        <!-- Loading Spinner -->
        <div 
          v-if="imageLoading" 
          class="absolute inset-0 flex items-center justify-center bg-gray-100"
        >
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
      
      <!-- Preload Images (Hidden) -->
      <div class="hidden">
        <img
          v-for="(image, index) in preloadImages"
          :key="index"
          :src="image"
          alt="Preload"
          @load="markImageAsLoaded(image)"
        />
      </div>
      
      <!-- Navigation Arrows -->
      <button
        v-if="showArrows && props.room.images && props.room.images.length > 1"
        @click.stop="prevImage"
        class="absolute left-2 top-1/2 bg-gray-800/70 text-white p-2 rounded-full hover:bg-gray-700 transition-colors z-10"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M12.707 14.707a1 1 0 01-1.414 0L7 10.414a1 1 0 010-1.414l4.293-4.293a1 1 0 011.414 1.414L9.414 10l3.293 3.293a1 1 0 010 1.414z" clip-rule="evenodd" />
        </svg>
      </button>

      <button
        v-if="showArrows && props.room.images && props.room.images.length > 1"
        @click.stop="nextImage"
        class="absolute right-2 top-1/2 bg-gray-800/70 text-white p-2 rounded-full hover:bg-gray-700 transition-colors z-10"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4.293 4.293a1 1 0 010 1.414l-4.293 4.293a1 1 0 01-1.414 0z" clip-rule="evenodd" />
        </svg>
      </button>

      <!-- Image Indicators -->
      <div 
        v-if="props.room.images && props.room.images.length > 1"
        class="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1"
      >
        <button
          v-for="(_, index) in props.room.images"
          :key="index"
          @click.stop="goToImage(index)"
          class="w-2 h-2 rounded-full transition-all duration-200"
          :class="index === currentImageIndex ? 'bg-white' : 'bg-white/50'"
        />
      </div>
    </div>

    <!-- Card Content -->
    <div class="p-4 space-y-2">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold text-gray-800">
          {{ truncateText(props.room.location,30) }}
        </h2>
      </div>
      <span class="text-blue-800 font-semibold text-lg">{{ props.room.budget }}€</span>

      <p class="text-gray-600 text-sm italic line-clamp-3 h-12 overflow-hidden">
        {{ truncateText(props.room.aboutProperty, 100) }}
      </p>

      <!-- Additional Information with Emojis -->
      <div class="flex flex-col mt-2 text-sm text-gray-700">
        <div class="flex justify-between">
          <span>🏠 {{ props.room.propertyType }} - {{ props.room.roomType }}</span>
          <span>🚿 {{ props.room.bathroomType }}</span>
        </div>
        <span>📅 {{ props.room.availableFrom }}</span>
      </div>
    </div>
  </div>

  <!-- Room Modal -->
  <RoomModal
    :room="props.room"
    :is-open="isModalOpen"
    @close="isModalOpen = false"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import FavoriteRoom from './FavoriteRoom.vue';
const RoomModal = defineAsyncComponent(() =>
  import('./RoomModal.vue')
); // Lazy load the modal component
import { useFavorites } from '~/composables/useFavorites';
import type { Room } from '~/types/room';

const props = defineProps<{
  room: Room;
}>();

const { isFavorited, favorites } = useFavorites();

const currentImageIndex = ref(0);
const showArrows = ref(false);
const isModalOpen = ref(false);
const imageLoading = ref(false);
const loadedImages = ref(new Set<string>());

// Use a ref for the favorite status
const favoriteStatus = ref(false);

// Compute which images to preload (next and previous)
const preloadImages = computed(() => {
  if (!props.room.images || props.room.images.length <= 1) return [];
  
  const images = props.room.images;
  const current = currentImageIndex.value;
  const preloadList = [];
  
  // Add next image
  const nextIndex = (current + 1) % images.length;
  if (!loadedImages.value.has(images[nextIndex])) {
    preloadList.push(images[nextIndex]);
  }
  
  // Add previous image
  const prevIndex = (current - 1 + images.length) % images.length;
  if (!loadedImages.value.has(images[prevIndex])) {
    preloadList.push(images[prevIndex]);
  }
  
  return preloadList;
});

// Set initial favorite status
onMounted(() => {
  updateFavoriteStatus();
  // Mark current image as loaded initially
  if (props.room.images && props.room.images.length > 0) {
    loadedImages.value.add(props.room.images[currentImageIndex.value]);
  }
});

// Watch for changes in favorites collection
watch(favorites, () => {
  updateFavoriteStatus();
});

// Function to update favorite status
function updateFavoriteStatus() {
  if (props.room && props.room.id) {
    favoriteStatus.value = isFavorited(props.room);
  }
}

// Mark image as loaded
function markImageAsLoaded(imageSrc: string) {
  loadedImages.value.add(imageSrc);
}

const truncateText = (text: string, maxLength: number): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

const prevImage = () => {
  if (!props.room.images || !props.room.images.length) return;
  currentImageIndex.value =
    (currentImageIndex.value - 1 + props.room.images.length) % props.room.images.length;
};

const nextImage = () => {
  if (!props.room.images || !props.room.images.length) return;
  currentImageIndex.value = (currentImageIndex.value + 1) % props.room.images.length;
};

const goToImage = (index: number) => {
  currentImageIndex.value = index;
};
</script>

<style scoped>
button {
  transition: background-color 0.3s ease, transform 0.2s ease;
}
button:hover {
  transform: scale(1.1);
}

/* Custom responsive breakpoint for screens smaller than 397px */
@media (max-width: 403px) {
  .w-96 {
    width: 22rem; /* 288px - smaller than w-80 (320px) */
  }
}
@media (max-width: 367px) {
  .w-96 {
    width: 19rem; /* 288px - smaller than w-80 (320px) */
  }
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>