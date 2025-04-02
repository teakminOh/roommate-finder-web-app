<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-gradient-to-br from-gray-300/70 to-gray-400/70 flex justify-center items-center z-50 p-4 overflow-hidden"
    @click="closeModal"
  >
    <div 
      class="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto relative" 
      @click.stop
    >
      <!-- Back Button -->
      <button
        @click="$emit('close')"
        class="absolute top-4 left-4 z-10 group flex items-center text-gray-600 hover:text-blue-600 transition-colors duration-200"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          class="h-10 w-10 mr-2 group-hover:-translate-x-1 transition-transform"
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          stroke-width="1.5"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        <span class="font-medium text-lg">Späť</span>
      </button>

      
        <!-- Image Gallery -->
        <div class="grid grid-cols-[2fr_1fr_1fr] gap-2 p-4 pb-0 mt-12">
          <div
            v-for="(image, index) in displayedImages"
            :key="index"
            class="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
            :class="[
              displayedImages.length === 1 ? 'col-span-3 mx-auto w-1/2' : '',
              index === 0 ? 'row-span-2' : ''
            ]"
            @click="showFullGallery = true"
          >
            <img
              :src="image.url"
              :alt="`Thumbnail ${index + 1}`"
              loading="lazy"
              class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-12 w-12 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
          </div>
          <!-- See All Photos Button -->
          <div
            v-if="processedImages.length > 5"
            class="absolute bottom-80 right-4"
          >
            <button
              @click="showFullGallery = true"
              class="bg-white/80 hover:bg-blue-100 text-blue-800 px-4 py-2 rounded-full flex items-center gap-2 shadow-md transition-all duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              Všetky fotky ({{ processedImages.length }})
            </button>
          </div>
        </div>
      

      <!-- Profile Content -->
      <div class="p-6 pt-2">
        <div class="flex flex-col md:flex-row gap-6">
          <!-- Room Profile Section -->
          <div class="flex-1">
            <h2 class="text-3xl font-bold text-blue-800 mb-4">
              {{ room.propertyType }} - {{ room.roomType }}
            </h2>
            
            <!-- Financial info card -->
            <div class="bg-blue-50 rounded-xl p-4 mb-6 flex justify-between items-center">
              <div>
                <p class="text-xl font-semibold text-blue-700">
                  Rozpočet: {{ room.budget }}€
                </p>
                <p class="text-sm text-blue-600">
                  {{ room.rentWithBills ? 'Vrátane poplatkov' : 'Bez poplatkov' }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-md font-medium text-blue-700">
                  Depozit: {{ room.securityDeposit }}€
                </p>
                <p class="text-sm text-blue-600">
                  K dispozícii od: {{ room.availableFrom }}
                </p>
              </div>
            </div>

            <!-- Room description -->
            <div class="mb-6">
              <h3 class="text-xl font-semibold text-gray-800 mb-2">O nehnuteľnosti</h3>
              <p class="text-gray-600 mb-4 leading-relaxed">
                {{ room.aboutProperty }}
              </p>
            </div>
            
            <!-- Roommates section -->
            <div class="mb-6">
              <h3 class="text-xl font-semibold text-gray-800 mb-2">O spolubývajúcich</h3>
              <p class="text-gray-600 mb-4 leading-relaxed">
                {{ room.aboutRoomies }}
              </p>
              <p class="text-sm text-gray-500">
                Preferované pohlavie: <span class="font-medium">{{ room.preferredGender }}</span>
              </p>
            </div>

            <!-- Location -->
            <div class="mb-6">
              <h3 class="text-xl font-semibold text-gray-800 mb-2">
                <span class="inline-block mr-2">📍</span> Lokalita
              </h3>
              <p class="text-gray-700">{{ room.location }}, {{ room.zip }}</p>
            </div>

            <!-- Amenities Grid -->
            <div class="mb-6">
              <h3 class="text-xl font-semibold text-gray-800 mb-2">Vybavenie a podmienky</h3>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                <AmenityItem 
                  :active="room.isFurnished"
                  icon="🪑"
                  label="Zariadený"
                />
                <AmenityItem 
                  :active="room.isPrivateRoom"
                  icon="🚪"
                  label="Súkromná izba"
                />
                <AmenityItem 
                  :active="room.internetIncluded"
                  icon="📶"
                  label="Internet v cene"
                />
                <AmenityItem 
                  :active="room.parkingAvailable"
                  icon="🚗"
                  label="Parkovanie"
                />
                <AmenityItem 
                  :active="room.isAccessible"
                  icon="♿"
                  label="Bezbariérový prístup"
                />
                <AmenityItem 
                  :active="room.studentsWelcome"
                  icon="🎓"
                  label="Vhodné pre študentov"
                />
              </div>
            </div>

            <!-- Pet Policy -->
            <div class="mb-6">
              <h3 class="text-xl font-semibold text-gray-800 mb-2">Domáce zvieratá</h3>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                <AmenityItem 
                  :active="room.petsAllowed"
                  icon="🐾"
                  label="Zvieratá povolené"
                />
                <AmenityItem 
                  :active="room.dogFriendly"
                  icon="🐕"
                  label="Vhodné pre psy"
                />
                <AmenityItem 
                  :active="room.catFriendly"
                  icon="🐈"
                  label="Vhodné pre mačky"
                />
                <AmenityItem 
                  :active="room.childrenFriendly"
                  icon="👶"
                  label="Vhodné pre deti"
                />
              </div>
            </div>

            <!-- Bathroom Info -->
            <div class="mb-6">
              <h3 class="text-xl font-semibold text-gray-800 mb-2">
                <span class="inline-block mr-2">🚿</span> Kúpeľňa
              </h3>
              <p class="text-gray-700">{{ room.bathroomType }}</p>
            </div>

            <!-- Contact info -->
            <div class="mt-8 p-4 bg-gray-50 rounded-xl">
              <h3 class="text-lg font-semibold text-gray-800 mb-2">Kontaktné informácie</h3>
              <p class="text-gray-700">
                <span class="inline-block mr-2">📧</span> {{ room.email }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <FullGallery
    v-if="showFullGallery"
    :images="processedImages"
    @close="showFullGallery = false"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import FullGallery from '../FullGallery.vue';
import AmenityItem from '~/components/rooms/AmenityItem.vue';
import type { Room } from '~/types/room';


const props = defineProps<{
  room: Room;
  isOpen: boolean;
}>();

const emit = defineEmits(['close']);
const showFullGallery = ref(false);
const processedImages = ref<Array<{ url: string; width: number; height: number }>>([]);

const displayedImages = computed(() => processedImages.value.slice(0, 5));

const loadImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.src = url;
  });
};

const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return 'Neznámy dátum';
  
  try {
    return new Intl.DateTimeFormat('sk-SK', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(date));
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Neplatný dátum';
  }
};

onMounted(async () => {
  // Process images to get their dimensions
  if (props.room.images && props.room.images.length > 0) {
    processedImages.value = await Promise.all(
      props.room.images.map(async (url) => {
        const dimensions = await loadImageDimensions(url);
        return {
          url,
          ...dimensions
        };
      })
    );
  } else {
    // Set to empty array if no images
    processedImages.value = [];
  }
});

const closeModal = () => {
  emit('close');
};
</script>

<style scoped>
/* Custom scrollbar for modal */
.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}
.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
}
.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}
.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>