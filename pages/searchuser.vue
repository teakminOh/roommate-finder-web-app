
<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
    <!-- Hero Section with Search -->
    <div class="relative overflow-hidden bg-white shadow-sm border-b border-gray-100">
      <div class="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5"></div>
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-16">
        <!-- Page Header -->
        <div class="text-center mb-10">
          <h1 class="text-4xl font-bold text-gray-900 mb-4">
            Nájdite svojho ideálneho spolubývajúceho
          </h1>
          <p class="text-lg text-gray-600 max-w-2xl mx-auto">
            Vyhľadajte spolubývajúcich vo vašej oblasti a nájdite perfektné bývanie
          </p>
        </div>

        <!-- Enhanced Location Search -->
        <div class="max-w-2xl mx-auto">
          <div class="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
            <div class="flex items-center mb-4">
              <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <h2 class="text-lg font-semibold text-gray-900">Vyhľadať lokalitu</h2>
            </div>
            
            <LocationSearchInput
              :initial-address="initialAddressForComponent"
              :initial-radius="initialRadiusForComponent"
              :google-maps-api-key="mapsApiKey"
              location-label="Lokalita pre spolubývajúceho"
              placeholder="Zadajte adresu alebo mesto"
              @update:location="handleLocationUpdate"
              @error="handleLocationError"
            />
            
            <!-- Enhanced Error Display -->
            <div v-if="pageLevelGeocodingError" 
                 class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <svg class="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p class="text-red-700 text-sm">{{ pageLevelGeocodingError }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="max-w-7xl mx-auto sm:px-6 lg:px-8 py-8">
      <!-- Filter Section -->
      <div class="mb-8">
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-visible">
          <button 
            @click="toggleFilters"
            class="w-full px-6 py-4 bg-gray-50 border-b border-gray-200 hover:bg-gray-100 transition-colors duration-200"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                  <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"/>
                  </svg>
                </div>
                <h3 class="text-lg font-semibold text-gray-900">Filtre vyhľadávania</h3>
              </div>
              <div class="flex items-center">
                <span class="text-sm text-gray-500 mr-2">
                  {{ filtersExpanded ? 'Skryť filtre' : 'Zobraziť filtre' }}
                </span>
                <svg 
                  class="w-5 h-5 text-gray-400 transform transition-transform duration-200"
                  :class="{ 'rotate-180': filtersExpanded }"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </div>
            </div>
          </button>
          
          <!-- Expandable Filter Content -->
          <div 
            class="transition-all duration-300 ease-in-out overflow-visible"
            :class="{
              'max-h-0 opacity-0': !filtersExpanded,
              'max-h-screen opacity-100': filtersExpanded
            }"
          >
            <div class="p-6 space-y-4">
              <RoommateFilter @filters-changed="updateActiveFilters" />
            </div>
          </div>
        </div>
      </div>

      <!-- Results Section -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-gray-900">Výsledky vyhľadávania</h3>
            </div>
            
            <!-- Search Status Indicator -->
            <div v-if="effectiveSearchAddress" class="flex items-center text-sm text-gray-500">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              </svg>
              {{ effectiveSearchAddress }} ({{ effectiveSearchRadiusKm }} km)
            </div>
          </div>
        </div>
        
        <div class="p-6">
          <RoommateList
            :initial-filters="activeRoommateFilters"
            :center-geo-point="effectiveSearchCenterGeoPoint"
            :search-radius-km="effectiveSearchRadiusKm"
            @roommates-updated="handleDisplayedRoommates"
          />
        </div>
      </div>

      <!-- No Results State (optional enhancement) -->
      <div v-if="!effectiveSearchCenterGeoPoint && !pageLevelGeocodingError" 
           class="text-center py-12">
        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Začnite vyhľadávanie</h3>
        <p class="text-gray-500">Zadajte lokalitu vyššie pre zobrazenie dostupných spolubývajúcich</p>
      </div>
    </div>

    <!-- Floating Action Button for Mobile (optional) -->
    <div class="fixed bottom-6 right-6 md:hidden">
      <button 
        type="button"
        class="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
        @click="scrollToFilters"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { GeoPoint } from 'firebase/firestore';
import LocationSearchInput from '~/components/LocationSearchInput.vue';
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
const initialRadiusForComponent = ref(15);

// --- Effective Search Parameters (used by RoommateList) ---
const effectiveSearchAddress = ref<string | null>(null);
const effectiveSearchCenterGeoPoint = ref<GeoPoint | null>(null);
const effectiveSearchRadiusKm = ref<number>(15);

// --- Other Page State ---
const activeRoommateFilters = ref<Partial<RoommateBaseFilters>>({});
const pageLevelGeocodingError = ref<string | null>(null);
const filtersExpanded = ref(false);

// --- Event Handlers ---
const handleLocationUpdate = (payload: { address: string; radius: number; geoPoint: GeoPoint | null }) => {
  console.log("searchuser.vue: Location update from component:", payload);
  pageLevelGeocodingError.value = null;

  effectiveSearchAddress.value = payload.address;
  effectiveSearchCenterGeoPoint.value = payload.geoPoint;
  effectiveSearchRadiusKm.value = payload.radius;

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
};

const updateActiveFilters = (newFilters: Partial<RoommateBaseFilters>) => {
  activeRoommateFilters.value = newFilters;
};

const toggleFilters = () => {
  filtersExpanded.value = !filtersExpanded.value;
};

const handleDisplayedRoommates = (displayedRoommates: Roommate[]) => {
  // console.log('Currently displayed roommates on page:', displayedRoommates.length);
};

// Utility function for mobile FAB
const scrollToFilters = () => {
  document.querySelector('.bg-white.rounded-xl')?.scrollIntoView({ 
    behavior: 'smooth', 
    block: 'start' 
  });
};

// --- Watcher for Route Query ---
watch(
  () => route.query,
  (newQuery) => {
    console.log("searchuser.vue: Route query changed:", newQuery);
    const newAddressFromRoute = (newQuery.address as string | undefined)?.trim() || '';
    const newRadiusFromRoute = Number(newQuery.radius) || 15;

    initialAddressForComponent.value = newAddressFromRoute;
    initialRadiusForComponent.value = newRadiusFromRoute;

    effectiveSearchAddress.value = newAddressFromRoute || null;
    effectiveSearchRadiusKm.value = newRadiusFromRoute;

    if (!newAddressFromRoute) {
        effectiveSearchCenterGeoPoint.value = null;
    }
  },
  { immediate: true, deep: true }
);

onMounted(() => {
  console.log("searchuser.vue mounted.");
});

</script>

<style scoped>
/* Custom animations and enhancements */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in-up {
  animation: fadeInUp 0.6s ease-out;
}

/* Ensure Google autocomplete dropdown visibility */
:deep(.pac-container) {
  z-index: 1050 !important;
  border-radius: 8px !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
  border: 1px solid #e5e7eb !important;
}

:deep(.pac-item) {
  padding: 12px 16px !important;
  border-bottom: 1px solid #f3f4f6 !important;
}

:deep(.pac-item:hover) {
  background-color: #f8fafc !important;
}

.max-w-7xl {
  max-width: 95rem; /* 640px */
}

/* Custom scrollbar for better aesthetics */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f5f9;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>