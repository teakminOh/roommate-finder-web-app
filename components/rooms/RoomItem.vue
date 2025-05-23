<template>
  <div 
    class="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 relative cursor-pointer transform hover:-translate-y-2 w-96"
    @mouseenter="showArrows = true"
    @mouseleave="showArrows = false"
    @click="isModalOpen = true"
  >
    <!-- Favorite Button -->
    <FavoriteRoom
      :modelValue="isFavorited(props.room)"
      :room="props.room"
      @update:modelValue="updateFavoriteStatus"
      class="absolute top-3 right-3 z-10"
    />

    <!-- Image Carousel -->
    <div class="relative">
      <img
        :src="props.room.images && props.room.images.length > 0 ? props.room.images[currentImageIndex] : '/images/placeholder.jpg'"
        alt="Room Image"
        class="w-full h-64 object-cover rounded-t-xl"
      />
      
      <!-- Navigation Arrows -->
      <button
        v-if="showArrows && props.room.images && props.room.images.length > 1"
        @click.stop="prevImage"
        class="absolute left-2 top-1/2 bg-gray-800/70 text-white p-2 rounded-full hover:bg-gray-700 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M12.707 14.707a1 1 0 01-1.414 0L7 10.414a1 1 0 010-1.414l4.293-4.293a1 1 0 011.414 1.414L9.414 10l3.293 3.293a1 1 0 010 1.414z" clip-rule="evenodd" />
        </svg>
      </button>

      <button
        v-if="showArrows && props.room.images && props.room.images.length > 1"
        @click.stop="nextImage"
        class="absolute right-2 top-1/2 bg-gray-800/70 text-white p-2 rounded-full hover:bg-gray-700 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4.293 4.293a1 1 0 010 1.414l-4.293 4.293a1 1 0 01-1.414 0z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>

    <!-- Card Content -->
    <div class="p-4 space-y-2">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold text-gray-800">
          {{ truncateText(props.room.location,30) }}
        </h2>
        
      </div>
      <span class="text-blue-600 font-semibold text-lg">{{ props.room.budget }}€</span>

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
import { ref } from 'vue';
import FavoriteRoom from './FavoriteRoom.vue';
import RoomModal from '~/components/rooms/RoomModal.vue';
import { useFavorites } from '~/composables/useFavorites';
import type { Room } from '~/types/room';

const props = defineProps<{
  room: Room;
}>();

const { favorites } = useFavorites();

const currentImageIndex = ref(0);
const showArrows = ref(false);
const isModalOpen = ref(false);

const isFavorited = (room: Room) => {
  return favorites.value?.some(fav => fav.room.id === room.id) ?? false;
};

const updateFavoriteStatus = (newStatus: boolean) => {
  // Additional actions can be handled here if needed
};

const truncateText = (text: string, maxLength: number): string => {
  if (!text) return ''; // Handle undefined or null text
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

const prevImage = () => {
  currentImageIndex.value =
    (currentImageIndex.value - 1 + props.room.images.length) % props.room.images.length;
};

const nextImage = () => {
  currentImageIndex.value = (currentImageIndex.value + 1) % props.room.images.length;
};
</script>

<style scoped>
button {
  transition: background-color 0.3s ease, transform 0.2s ease;
}
button:hover {
  transform: scale(1.1);
}
</style>
