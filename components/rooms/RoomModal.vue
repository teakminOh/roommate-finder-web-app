<template>
  <Teleport to="body">
  <div
    v-if="isOpen"
    class="modal-backdrop fixed inset-0 bg-gradient-to-br from-gray-300/70 to-gray-400/70 flex justify-center items-center p-4 overflow-hidden max-[424px]:p-0"
    @click="closeModal"
  >
    <div 
      class="bg-white shadow-2xl w-full max-w-6xl max-h-[100vh] overflow-y-auto relative max-[424px]:max-w-none max-[424px]:w-full max-[424px]:h-full max-[424px]:max-h-none" 
      @click.stop
    >
      <!-- Back Button -->
      <button
        @click="$emit('close')"
        class="absolute top-4 left-4 z-10 group flex items-center text-gray-600 hover:text-blue-800 transition-colors duration-200"
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
      <button
        @click="$emit('close')"
        class="fixed bottom-14 right-6 z-50 bg-blue-800 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center w-14 h-14 max-[779px]:block hidden"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          class="h-8 w-8 ml-3"
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          stroke-width="2"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      
        <!-- Image Gallery -->
        <div class="grid grid-cols-[2fr_1fr_1fr] gap-2 p-4 pb-0 mt-12 max-[424px]:grid-cols-1 max-[424px]:gap-1 max-[424px]:p-2 max-[424px]:mt-16">
          <div
            v-for="(image, index) in displayedImages"
            :key="index"
            class="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
            :class="[
              displayedImages.length === 1 ? 'col-span-3 mx-auto w-1/2 max-[424px]:col-span-1 max-[424px]:w-full' : '',
              index === 0 ? 'row-span-2 max-[424px]:row-span-1' : ''
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
            class="absolute bottom-80 right-4 max-[424px]:bottom-4 max-[424px]:right-2"
          >
            <button
              @click="showFullGallery = true"
              class="bg-white/80 hover:bg-blue-100 text-blue-800 px-4 py-2 rounded-full flex items-center gap-2 shadow-md transition-all duration-200 max-[424px]:px-3 max-[424px]:py-1 max-[424px]:text-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6 max-[424px]:h-4 max-[424px]:w-4"
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
      <div class="p-6 pt-2 max-[424px]:p-4 max-[424px]:pt-2">
        <div class="flex flex-col md:flex-row gap-6">
          <!-- Room Profile Section -->
          <div class="flex-1">
            <h2 class="text-3xl font-bold text-blue-800 mb-4 max-[424px]:text-2xl">
              {{ room.propertyType }} - {{ room.roomType }}
            </h2>
            
            <!-- Financial info card -->
            <div class="bg-blue-50 rounded-xl p-4 mb-6 flex justify-between items-center max-[424px]:flex-col max-[424px]:items-start max-[424px]:gap-2">
              <div>
                <p class="text-xl font-semibold text-blue-700 max-[424px]:text-lg">
                  Rozpočet: {{ room.budget }}€
                </p>
                <p class="text-sm text-blue-600">
                  {{ room.rentWithBills ? 'Vrátane poplatkov' : 'Bez poplatkov' }}
                </p>
              </div>
              <div class="text-right max-[424px]:text-left max-[424px]:w-full">
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
              <h3 class="text-xl font-semibold text-gray-800 mb-2 max-[424px]:text-lg">O nehnuteľnosti</h3>
              <p class="text-gray-600 mb-4 leading-relaxed max-[424px]:text-sm">
                {{ room.aboutProperty }}
              </p>
            </div>
            
            <!-- Roommates section -->
            <div class="mb-6">
              <h3 class="text-xl font-semibold text-gray-800 mb-2 max-[424px]:text-lg">O spolubývajúcich</h3>
              <p class="text-gray-600 mb-4 leading-relaxed max-[424px]:text-sm">
                {{ room.aboutRoomies }}
              </p>
              <p class="text-sm text-gray-500">
                Preferované pohlavie: <span class="font-medium">{{ room.preferredGender }}</span>
              </p>
            </div>

            <!-- Location -->
            <div class="mb-6">
              <h3 class="text-xl font-semibold text-gray-800 mb-2 max-[424px]:text-lg">
                <span class="inline-block mr-2">📍</span> Lokalita
              </h3>
              <p class="text-gray-700 max-[424px]:text-sm">{{ room.location }}, {{ room.zip }}</p>
            </div>

            <!-- Amenities Grid -->
            <div class="mb-6">
              <h3 class="text-xl font-semibold text-gray-800 mb-2 max-[424px]:text-lg">Vybavenie a podmienky</h3>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 max-[424px]:grid-cols-2 max-[424px]:gap-2">
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
              <h3 class="text-xl font-semibold text-gray-800 mb-2 max-[424px]:text-lg">Domáce zvieratá</h3>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 max-[424px]:grid-cols-2 max-[424px]:gap-2">
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
              <h3 class="text-xl font-semibold text-gray-800 mb-2 max-[424px]:text-lg">
                <span class="inline-block mr-2">🚿</span> Kúpeľňa
              </h3>
              <p class="text-gray-700 max-[424px]:text-sm">{{ room.bathroomType }}</p>
            </div>

            <!-- Contact info -->
            <div class="mt-8 p-4 bg-gray-50 rounded-xl">
              <h3 class="text-lg font-semibold text-gray-800 mb-2 max-[424px]:text-base">Kontaktné informácie</h3>
              <p class="text-gray-700 max-[424px]:text-sm max-[424px]:break-all">
                <span class="inline-block mr-2">📧</span> {{ room.email }}
              </p>
            </div>
          </div>
        </div>
        <div v-if="user" class="mt-6 pt-6 border-t">
            <div v-if="isLoadingCurrentUser" class="text-center text-gray-500">Loading your location...</div>
            <TravelTimeEstimator
                v-else-if="originCoords && destinationCoords"
                :origin-coords="originCoords"
                :destination-coords="destinationCoords"
                :api-key="''"
            />
        
        </div>
        <div v-if="user" class="mt-6 h-full flex flex-col">
          <ChatWindow
            :other-user-id="room.id"
            :other-user-name="room.email"
            class="flex-grow min-h-0"
          />
        </div>
      </div>
    </div>
  </div>

  <!-- FullGallery with higher z-index -->
  <FullGallery
    v-if="showFullGallery"
    :images="processedImages"
    @close="showFullGallery = false"
    class="gallery-overlay"
  />
</Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'; // Import watch
import { useCurrentUser, useFirestore } from 'vuefire'; // Import useCurrentUser and useFirestore
import { doc, getDoc } from 'firebase/firestore'; // Import getDoc and doc

// Import Components
import FullGallery from '../FullGallery.vue';
import AmenityItem from '~/components/rooms/AmenityItem.vue'; // Assuming this is used in your template
import TravelTimeEstimator from '~/components/TravelTimeEstimator.vue'; // Your estimator component
import type { Roommate } from '~/types/user'; // Assuming you have a Roommate type defined
// Import InfoItem if used
// import InfoItem from './InfoItem.vue';

// Import Types
import type { Room } from '~/types/room';

const props = defineProps<{
  room: Room; // Expecting the full Room object
  isOpen: boolean;
}>();

const emit = defineEmits(['close']);

// --- State ---
const showFullGallery = ref(false);
const processedImages = ref<Array<{ url: string; width: number; height: number }>>([]);
// Removed showChatView as this modal is for Rooms, not user profiles with chat toggle
// const showChatView = ref(false);

// State for Current User and their profile (needed for origin coordinates)
const isLoadingCurrentUser = ref(false);
const currentRoommate = ref<Roommate | null>(null);

// --- Firebase ---
const user = useCurrentUser(); // Get reactive logged-in user state
const db = useFirestore(); // Get Firestore instance

// --- Computed Properties ---
const displayedImages = computed(() => processedImages.value.slice(0, 5));

// Computed Coordinates for TravelTimeEstimator
const originCoords = computed(() => {
    const coords = currentRoommate.value?.coordinates; // Firestore GeoPoint
    console.log("RoomModal - Current User Coords (GeoPoint Object):", coords);
    // Access properties WITHOUT underscores
    if (coords && typeof coords.latitude === 'number' && typeof coords.longitude === 'number') {
         console.log("RoomModal - Creating Origin:", { latitude: coords.latitude, longitude: coords.longitude });
        // Use .latitude and .longitude
        return { latitude: coords.latitude, longitude: coords.longitude };
    }
     console.log("RoomModal - Origin Coords Invalid or Missing");
    return null;
});

const destinationCoords = computed(() => {
     const coords = props.room?.coordinates as any; // Cast to any temporarily to check both properties
     console.log("RoomModal - Raw Room Coords Object:", coords);

     let lat: number | undefined = undefined;
     let lng: number | undefined = undefined;

     // Try accessing standard properties first, then internal ones
     if (coords && typeof coords.latitude === 'number') {
         lat = coords.latitude;
     } else if (coords && typeof coords._latitude === 'number') { // Check internal property
         lat = coords._latitude;
     }

     if (coords && typeof coords.longitude === 'number') {
         lng = coords.longitude;
     } else if (coords && typeof coords._longitude === 'number') { // Check internal property
         lng = coords._longitude;
     }

      console.log(`RoomModal - Extracted Lat: ${lat} (type: ${typeof lat})`);
      console.log(`RoomModal - Extracted Lng: ${lng} (type: ${typeof lng})`);


     // Check if BOTH valid numbers were extracted
     if (typeof lat === 'number' && typeof lng === 'number') {
          console.log("RoomModal - Creating Destination:", { latitude: lat, longitude: lng });
         // Return the standard { latitude, longitude } object
         return { latitude: lat, longitude: lng };
     }

      console.log("RoomModal - Destination Coords Check FAILED after checking properties");
     return null;
});
// --- Functions ---

const loadImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => { // Added reject
        const img = new Image();
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = (e) => {
             console.error("Failed to load image for dimensions:", url, e);
             reject(new Error(`Failed to load image: ${url}`));
         };
        img.src = url;
    });
};

async function fetchCurrentRoommate(userId: string) {
    if (!userId || currentRoommate.value?.id === userId) return; // Don't refetch if already loaded for same user

    console.log("Fetching current user profile for coords...");
    isLoadingCurrentUser.value = true;
    const userRef = doc(db, 'users', userId); // Use correct 'users' collection name
    try {
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            // Make sure the Roommate type includes 'coordinates'
            currentRoommate.value = { ...userSnap.data(), id: userSnap.id } as Roommate;
            console.log("Current user profile loaded:", currentRoommate.value?.id);
        } else {
            console.warn("Current user profile not found in Firestore.");
            currentRoommate.value = null;
        }
    } catch (error) {
        console.error("Error fetching current user profile:", error);
        currentRoommate.value = null;
    } finally {
        isLoadingCurrentUser.value = false;
    }
}

const formatDate = (dateValue: any): string => { // Accept Date | string | Timestamp | null | undefined
    if (!dateValue) return 'Neznámy dátum';
    let date: Date | null = null;
    try {
        if (dateValue instanceof Date) {
            date = dateValue;
        } else if (typeof dateValue === 'string') {
            date = new Date(dateValue);
        } else if (typeof dateValue === 'object' && typeof dateValue.toDate === 'function') {
            // Handle Firestore Timestamp
            date = dateValue.toDate();
        }

        if (date && !isNaN(date.getTime())) { // Check if date is valid
            return new Intl.DateTimeFormat('sk-SK', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }).format(date);
        } else {
            return 'Neplatný dátum';
        }
    } catch (error) {
        console.error('Error formatting date:', error, dateValue);
        return 'Chyba formátovania';
    }
};

const closeModal = () => {
  emit('close');
};

// --- Watchers ---
// Watch for user login/logout OR modal opening to fetch profile
watch([user, () => props.isOpen], ([newUser, newIsOpen]) => {
    if (newIsOpen && newUser) {
        fetchCurrentRoommate(newUser.uid); // Fetch when modal opens AND user exists
    }
    if (!newUser) {
        currentRoommate.value = null; // Clear profile on logout
    }
}, { immediate: true }); // Check immediately on component setup

// --- Lifecycle Hooks ---
onMounted(async () => {
  // Process room images
  if (props.room?.images && Array.isArray(props.room.images)) {
      const imagePromises = props.room.images.map(async (url) => {
        try {
           const dimensions = await loadImageDimensions(url);
           return { url, ...dimensions };
        } catch (error) {
           return { url, width: 0, height: 0 }; // Default on error
        }
      });
      processedImages.value = await Promise.all(imagePromises);
  } else {
       processedImages.value = [];
  }
});

</script>

<style scoped>
/* Main modal backdrop */
.modal-backdrop {
  z-index: 9999 !important; /* Higher than navbar's z-20 */
}

/* FullGallery overlay - HIGHER than modal */
.gallery-overlay {
  z-index: 10001 !important; /* Higher than modal's 9999 */
}

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

/* Mobile full-screen styles for screens smaller than 425px */
@media (max-width: 424px) {
  .overflow-y-auto::-webkit-scrollbar {
    width: 4px;
  }
}
</style>