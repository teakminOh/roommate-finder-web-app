<template>
  <div 
    class="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-lg hover:shadow-2xl relative cursor-pointer w-96"
    @mouseenter="showArrows = true"
    @mouseleave="showArrows = false"
    @click="isModalOpen = true"
  >
    <!-- Favorite Button -->
    <FavoriteRoommate
      v-model="favoriteStatus"
      :roommate="props.roommate"
      class="absolute top-3 right-3 z-10"
    />

    <!-- Image Carousel -->
    <div class="relative">
      <img
        :src="props.roommate.images && props.roommate.images.length > 0 ? props.roommate.images[currentImageIndex] : '/images/thumbup.png'"
        alt="Roommate Image"
        class="w-full h-64 object-cover rounded-t-xl"
        loading="lazy"
      />
      
      <!-- Navigation Arrows -->
      <button
        v-if="showArrows && props.roommate.images && props.roommate.images.length > 1"
        @click.stop="prevImage"
        class="absolute left-2 top-1/2 bg-gray-800/70 text-white p-2 rounded-full hover:bg-gray-700 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M12.707 14.707a1 1 0 01-1.414 0L7 10.414a1 1 0 010-1.414l4.293-4.293a1 1 0 011.414 1.414L9.414 10l3.293 3.293a1 1 0 010 1.414z" clip-rule="evenodd" />
        </svg>
      </button>

      <button
        v-if="showArrows && props.roommate.images && props.roommate.images.length > 1"
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
        <h2 class="text-xl font-bold text-gray-800">{{ props.roommate.firstName }}</h2>
        
      </div>
      <span class="text-blue-800 font-semibold text-lg">{{ props.roommate.budget }}€</span>

      <p class="text-gray-600 text-sm italic line-clamp-3 h-12 overflow-hidden">
        {{ truncateText(props.roommate.bio,100) }}
      </p>

      <!-- Additional Information with Emojis -->
      <div class="flex flex-col mt-2 text-sm text-gray-700">
        <div class="flex justify-between">
          <span>🎂 {{ props.roommate.age }}</span>
          <span>
            {{ props.roommate.gender === 'Muž' ? 'Muž 👨' : 'Žena 👩' }}
          </span>
        </div>
        <div class="flex justify-between">
          <span>
            {{ props.roommate.student ? '🎓 Študent' : '' }}
          </span>
          <span>📍 {{ truncateText(props.roommate.location,35) }}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Roommate Modal -->
  <RoommateModal
    :roommate="props.roommate"
    :is-open="isModalOpen"
    @close="isModalOpen = false"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import FavoriteRoommate from './FavoriteRoommate.vue';
import type { Roommate } from '~/types/user';
const RoommateModal = defineAsyncComponent(() =>
  import('./RoommateModal.vue')
);
import { useFavorites } from '~/composables/useFavorites';

const truncateText = (text: string, maxLength: number): string => {
  if (!text) return ''; // Handle undefined or null text
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

const props = defineProps<{
  roommate: Roommate;
}>();

const { isFavorited, favorites } = useFavorites();

const currentImageIndex = ref(0);
const showArrows = ref(false);
const isModalOpen = ref(false);
const favoriteStatus = ref(false);

// Set initial favorite status
onMounted(() => {
  updateFavoriteStatus();
});

// Watch for changes in favorites collection
watch(favorites, () => {
  updateFavoriteStatus();
});

// Function to update favorite status
function updateFavoriteStatus() {
  if (props.roommate && props.roommate.id) {
    favoriteStatus.value = isFavorited(props.roommate);
  }
}

const prevImage = () => {
  if (!props.roommate.images || !props.roommate.images.length) return;
  
  currentImageIndex.value =
    (currentImageIndex.value - 1 + props.roommate.images.length) % props.roommate.images.length;
};

const nextImage = () => {
  if (!props.roommate.images || !props.roommate.images.length) return;
  
  currentImageIndex.value = (currentImageIndex.value + 1) % props.roommate.images.length;
};
</script>

<style scoped>
/* Smooth transitions and hover effects */
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
</style>