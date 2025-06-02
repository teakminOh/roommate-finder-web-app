// pages/search-rooms.vue
<template>
  <div class="flex flex-col mt-16">
    <!-- Search and Filter Controls -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mt-4 mb-4 mx-4">
      <LocationSearchInput
        class="flex-1 min-w-0"
        :initial-address="initialAddressForComponent"
        :initial-radius="initialRadiusForComponent"
        :google-maps-api-key="googleMapsApiKey"
        @update:location="handleLocationUpdateFromComponent"
        @error="handleLocationComponentError"
      />
      <RoomFilter
        class="flex-1 min-w-0 z-50"
        @filters-changed="handleFiltersChange"
        :initial-address="effectiveSearchAddress"
      />
    </div>

    <!-- Mobile Toggle Buttons (visible only on mobile) -->
    <div class="flex md:hidden mx-4 mb-6">
      <div class="flex w-full bg-white/60 backdrop-blur-sm rounded-xl p-1 shadow-lg border border-white/20">
        <button 
          @click="activeView = 'list'"
          :class="[
            'flex-1 py-3 px-4 text-sm font-semibold rounded-lg transition-all duration-300 ease-in-out',
            activeView === 'list' 
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md transform scale-105' 
              : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
          ]"
        >
          <span class="flex items-center justify-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>
            </svg>
            Room List
          </span>
        </button>
        <button 
          @click="activeView = 'map'"
          :class="[
            'flex-1 py-3 px-4 text-sm font-semibold rounded-lg transition-all duration-300 ease-in-out',
            activeView === 'map' 
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md transform scale-105' 
              : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
          ]"
        >
          <span class="flex items-center justify-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            Map View
          </span>
        </button>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="flex flex-col md:flex-row h-screen">
      <!-- Room List Section -->
      <div :class="[
        'md:w-1/2 px-4 overflow-y-auto',
        // Mobile visibility control and height
        activeView === 'list' ? 'block flex-1' : 'hidden md:block'
      ]">
        <RoomList
          :filters="activeFilters"
          :center-geo-point="effectiveCenterGeoPoint"
          :search-radius-km="effectiveSearchRadiusKm"
          :search-address="effectiveSearchAddress"
          @rooms-updated="handleRoomsUpdateForMap"
        />
      </div>
      
      <!-- Map Section -->
      <div :class="[
        'md:w-1/2 bg-gray-200',
        // Mobile visibility control and height
        activeView === 'map' ? 'block flex-1 min-h-[500px]' : 'hidden md:block'
      ]">
        <Map
          :api-key="googleMapsApiKey"
          :rooms-to-display="roomsForMap"
          :center-geo-point="effectiveCenterGeoPoint"
          :search-radius-km="effectiveSearchRadiusKm"
          :search-address="effectiveSearchAddress"
          :key="`map-${mapUpdateKey}`"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { GeoPoint } from 'firebase/firestore';
import LocationSearchInput from '~/components/LocationSearchInput.vue';
import RoomList from '~/components/rooms/RoomList.vue';
import RoomFilter from '~/components/RoomFilter.vue';
import Map from '~/components/Map.vue';
import type { Filters as FilterPayload } from '~/components/RoomFilter.vue';
import type { Room } from '~/types/room';

const config = useRuntimeConfig();
const googleMapsApiKey = config.public.googleMapsApiKey || "";

if (!googleMapsApiKey) {
    console.error("ERROR: Google Maps API Key is not defined!");
}

definePageMeta({
  layout: "buy",
});

const route = useRoute();
const router = useRouter();

// --- Mobile View State ---
const activeView = ref<'list' | 'map'>('list');

// --- State for LocationSearchInput component props ---
const initialAddressForComponent = ref('');
const initialRadiusForComponent = ref(10);

// --- Effective Search Parameters ---
const effectiveSearchAddress = ref<string | null>(null);
const effectiveCenterGeoPoint = ref<GeoPoint | null>(null);
const effectiveSearchRadiusKm = ref<number>(10);

// --- Other Page State ---
const activeFilters = ref<Partial<FilterPayload>>({});
const roomsForMap = ref<Room[]>([]);
const pageLevelError = ref<string | null>(null);
const mapUpdateKey = ref(0); // Added to force Map component re-render when needed

const handleFiltersChange = (newFilters: Partial<FilterPayload>) => {
  activeFilters.value = newFilters;
};

const handleRoomsUpdateForMap = (updatedRooms: Room[]) => {
  roomsForMap.value = updatedRooms;
};

// --- Handler for LocationSearchInput component ---
const handleLocationUpdateFromComponent = (payload: { address: string; radius: number; geoPoint: GeoPoint | null }) => {
  console.log("Location update from component:", payload);
  pageLevelError.value = null;

  // Store the previous values to detect real changes
  const previousAddress = effectiveSearchAddress.value;
  const previousRadius = effectiveSearchRadiusKm.value;
  const previousGeoPoint = effectiveCenterGeoPoint.value;

  // Update effective search parameters
  effectiveSearchAddress.value = payload.address;
  effectiveSearchRadiusKm.value = payload.radius;
  effectiveCenterGeoPoint.value = payload.geoPoint;

  // Update the URL only if values are different from current route query
  const currentQueryAddress = (route.query.address as string || '');
  const currentQueryRadius = Number(route.query.radius) || 10; // Use same default as initialRadiusForComponent

  if (payload.address !== currentQueryAddress || payload.radius !== currentQueryRadius) {
    router.push({
      query: {
        ...route.query,
        address: payload.address || undefined,
        radius: payload.radius.toString()
      }
    });
  } else if (!payload.address && currentQueryAddress) {
    router.push({ 
      query: { 
        ...route.query, 
        address: undefined, 
        radius: payload.radius.toString() 
      } 
    });
  }

  // Force map re-render if the radius, address, or geoPoint has changed significantly
  const isGeoPointChanged = Boolean(
    (previousGeoPoint && !payload.geoPoint) || 
    (!previousGeoPoint && payload.geoPoint) ||
    (previousGeoPoint && payload.geoPoint && 
     (previousGeoPoint.latitude !== payload.geoPoint.latitude || 
      previousGeoPoint.longitude !== payload.geoPoint.longitude))
  );

  if (previousRadius !== payload.radius || previousAddress !== payload.address || isGeoPointChanged) {
    // Increment key to force Map component to re-render completely
    mapUpdateKey.value++;
  }
};

const handleLocationComponentError = (message: string) => {
  console.error("Error from LocationSearchInput component:", message);
  pageLevelError.value = message;
};

// --- Watcher for Route Query ---
watch(
  () => route.query,
  (newQuery) => {
    console.log("Parent: Route query changed:", newQuery);
    const newAddressFromRoute = (newQuery.address as string | undefined)?.trim() || '';
    const newRadiusFromRoute = Number(newQuery.radius) || 10;

    // Only update component props if values have actually changed
    if (initialAddressForComponent.value !== newAddressFromRoute) {
      initialAddressForComponent.value = newAddressFromRoute;
    }
    
    if (initialRadiusForComponent.value !== newRadiusFromRoute) {
      initialRadiusForComponent.value = newRadiusFromRoute;
    }

    // Handle direct URL changes (e.g., browser back/forward)
    // Only update if the values are actually different to avoid redundant rerenders
    const isAddressDifferent = effectiveSearchAddress.value !== (newAddressFromRoute || null);
    const isRadiusDifferent = effectiveSearchRadiusKm.value !== newRadiusFromRoute;
    
    if (isAddressDifferent || isRadiusDifferent) {
      // For direct URL navigation, update the effective values
      if (isAddressDifferent) {
        effectiveSearchAddress.value = newAddressFromRoute || null;
      }
      
      if (isRadiusDifferent) {
        effectiveSearchRadiusKm.value = newRadiusFromRoute;
      }
      
      // If address was removed, clear the geoPoint
      if (!newAddressFromRoute && effectiveCenterGeoPoint.value) {
        effectiveCenterGeoPoint.value = null;
        // When address is cleared, we want to reset the map completely
        mapUpdateKey.value++;
      }
      
      // Note: We don't force map re-render here because LocationSearchInput 
      // will handle geocoding and emit an update which will trigger handleLocationUpdateFromComponent
    }
  },
  { immediate: true, deep: true }
);

onMounted(() => {
  console.log("search-rooms.vue mounted.");
});
</script>