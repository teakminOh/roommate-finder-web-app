// pages/searchuser.vue
<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">

    <!-- Reusable Location Search Component -->
    <LocationSearchInput
      class="mb-6"
      :initial-address="initialAddressForComponent"
      :initial-radius="initialRadiusForComponent"
      :google-maps-api-key="mapsApiKey"
      location-label="Hľadať lokalitu pre spolubývajúceho"
      placeholder="Zadajte adresu alebo mesto"
      @update:location="handleLocationUpdate"
      @error="handleLocationError"
    />
    <p v-if="pageLevelGeocodingError" class="text-red-500 text-sm -mt-4 mb-4 px-4">{{ pageLevelGeocodingError }}</p>


    <!-- Roommate Filter Component -->
    <div class="mb-8">
      <RoommateFilter @filters-changed="updateActiveFilters" />
    </div>

    <!-- Roommate List Component -->
    <RoommateList
      :initial-filters="activeRoommateFilters"
      :center-geo-point="effectiveSearchCenterGeoPoint"
      :search-radius-km="effectiveSearchRadiusKm"
      @roommates-updated="handleDisplayedRoommates"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { GeoPoint } from 'firebase/firestore';
import LocationSearchInput from '~/components/LocationSearchInput.vue'; // Import the component
import RoommateList from '~/components/users/RoommateList.vue';
import RoommateFilter from '~/components/users/RoommateFilter.vue';
import type { EmittedFilters as RoommateBaseFilters } from '~/components/users/RoommateFilter.vue';
import type { Roommate } from '~/types/user';

definePageMeta({
  layout: "buy",
});

const route = useRoute();
const router = useRouter();

const config = useRuntimeConfig();
const mapsApiKey = config.public.googleMapsApiKey || "";

if (!mapsApiKey) {
    console.error("ERROR: Google Maps API Key is not defined for searchuser.vue!");
}

// --- State for LocationSearchInput component props ---
const initialAddressForComponent = ref('');
const initialRadiusForComponent = ref(15); // Default radius for roommate search

// --- Effective Search Parameters (used by RoommateList) ---
const effectiveSearchAddress = ref<string | null>(null); // Keep track of the address string for display/context
const effectiveSearchCenterGeoPoint = ref<GeoPoint | null>(null);
const effectiveSearchRadiusKm = ref<number>(15);

// --- Other Page State ---
const activeRoommateFilters = ref<Partial<RoommateBaseFilters>>({});
const pageLevelGeocodingError = ref<string | null>(null); // For displaying errors from the component

// --- Event Handlers ---
const handleLocationUpdate = (payload: { address: string; radius: number; geoPoint: GeoPoint | null }) => {
  console.log("searchuser.vue: Location update from component:", payload);
  pageLevelGeocodingError.value = null; // Clear previous errors

  effectiveSearchAddress.value = payload.address; // Store the address string
  effectiveSearchCenterGeoPoint.value = payload.geoPoint;
  effectiveSearchRadiusKm.value = payload.radius;

  // Update the URL if the component's emitted values differ from current route query
  const currentQueryAddress = (route.query.address as string || '');
  const currentQueryRadius = Number(route.query.radius) || 0;

  if (payload.address !== currentQueryAddress || payload.radius !== currentQueryRadius) {
    router.push({
      query: {
        ...route.query,
        address: payload.address || undefined,
        radius: payload.radius.toString()
      }
    });
  } else if (!payload.address && currentQueryAddress) {
     router.push({ query: { ...route.query, address: undefined, radius: payload.radius.toString() } });
  }
};

const handleLocationError = (message: string) => {
  console.error("searchuser.vue: Error from LocationSearchInput component:", message);
  pageLevelGeocodingError.value = message;
  // Optionally clear effective search parameters if the error is critical
  // effectiveSearchCenterGeoPoint.value = null;
  // effectiveSearchAddress.value = null;
};

const updateActiveFilters = (newFilters: Partial<RoommateBaseFilters>) => {
  activeRoommateFilters.value = newFilters;
  // Note: If filters could also change location, you'd need to handle that interaction.
  // For now, assuming filters are independent of location search handled by LocationSearchInput.
};

const handleDisplayedRoommates = (displayedRoommates: Roommate[]) => {
  // console.log('Currently displayed roommates on page:', displayedRoommates.length);
};

// --- Watcher for Route Query ---
watch(
  () => route.query,
  (newQuery) => {
    console.log("searchuser.vue: Route query changed:", newQuery);
    const newAddressFromRoute = (newQuery.address as string | undefined)?.trim() || '';
    const newRadiusFromRoute = Number(newQuery.radius) || 15; // Default radius

    // Update props for LocationSearchInput component
    initialAddressForComponent.value = newAddressFromRoute;
    initialRadiusForComponent.value = newRadiusFromRoute;

    // Update effective search parameters for RoommateList
    // This handles direct URL navigation or back/forward browser buttons
    // The LocationSearchInput component, through its prop watchers, should eventually emit
    // an 'update:location' event with the geoPoint if the address prop changes.
    // We primarily rely on that emission to set effectiveSearchCenterGeoPoint.
    effectiveSearchAddress.value = newAddressFromRoute || null;
    effectiveSearchRadiusKm.value = newRadiusFromRoute;

    // If address is removed from URL, clear the geopoint
    if (!newAddressFromRoute) {
        effectiveSearchCenterGeoPoint.value = null;
    }
    // If address IS in URL, the component's logic should lead to an emit
    // which will set effectiveSearchCenterGeoPoint via handleLocationUpdate.
    // We avoid redundant geocoding here.
  },
  { immediate: true, deep: true }
);

onMounted(() => {
  // The LocationSearchInput component handles its own Google Maps script loading.
  console.log("searchuser.vue mounted.");
  // Any other page-specific initialization for searchuser.vue
});

</script>

<style scoped>
/* Ensure Google autocomplete dropdown is visible above other elements if needed by LocationSearchInput*/
/* The component itself should handle this, but if you have stacking context issues on this page,
   you might need to adjust z-index here or on parent elements.
.pac-container {
    z-index: 1050 !important;
}
*/
</style>