// pages/search-rooms.vue
<template>
  <div class="flex flex-col mt-16">
    <div class="flex items-center gap-4 mt-4 mb-4 mx-4">
      <LocationSearchInput
        class="flex-1"
        :initial-address="initialAddressForComponent"
        :initial-radius="initialRadiusForComponent"
        :google-maps-api-key="googleMapsApiKey"
        @update:location="handleLocationUpdateFromComponent"
        @error="handleLocationComponentError"
      />
      <RoomFilter
        class="flex-1"
        @filters-changed="handleFiltersChange"
        :initial-address="effectiveSearchAddress"
      />
    </div>

    <div class="flex h-screen">
      <!-- Use the new component -->
    
      <!-- Rest of your template for RoomFilter, RoomList, Map -->
      <div class="w-1/2 px-4 overflow-y-auto">
    
        <RoomList
          :filters="activeFilters"
          :center-geo-point="effectiveCenterGeoPoint"
          :search-radius-km="effectiveSearchRadiusKm"
          :search-address="effectiveSearchAddress"
          @rooms-updated="handleRoomsUpdateForMap"
        />
      </div>
      <div class="w-1/2 bg-gray-200">
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