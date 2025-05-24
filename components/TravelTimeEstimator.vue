<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
// NO import { Loader } from '@googlemaps/js-api-loader'; // <-- REMOVED
import RouteMapViewer from './RouteMapViewer.vue'; // Import komponentu mapy

// --- Typy ---
interface LatLngLiteral {
  lat: number;
  lng: number;
}

enum TravelMode {
  DRIVING = 'DRIVING',
  WALKING = 'WALKING',
  TRANSIT = 'TRANSIT',
}

interface TravelEstimate {
  modeKey: TravelMode;
  displayMode: string;
  icon: string;
  durationText?: string;
  distanceText?: string;
  error?: string;
}

// --- Props ---
const props = defineProps<{
  originCoords: { latitude: number; longitude: number } | null;
  destinationCoords: { latitude: number; longitude: number } | null;
}>();

// --- Stav ---
const estimates = ref<TravelEstimate[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const selectedModeKey = ref<TravelMode | null>(null);
const showMap = ref<boolean>(false);

// --- Google Maps Instances ---
// Store instances outside refs if not needing reactivity for the instance itself
let directionsServiceInstance: google.maps.DirectionsService | null = null;
let MapsDirectionsStatus: typeof google.maps.DirectionsStatus | null = null;

// --- REMOVED Loader related code ---
// const mapsApiKey = "AIzaSyD..."; // <-- REMOVED
// const loader = new Loader({ ... }); // <-- REMOVED

// --- Metódy ---
function toggleRouteMap(modeKey: TravelMode) {
  if (selectedModeKey.value === modeKey && showMap.value) {
    showMap.value = false;
    selectedModeKey.value = null;
  } else {
    selectedModeKey.value = modeKey;
    showMap.value = true;
  }
}

async function loadMapsApiAndFetchEstimates() {
  if (!props.originCoords || !props.destinationCoords) {
    estimates.value = []; // Clear estimates if coords are missing
    return;
  }

  // 1. Check if the global Google Maps script has loaded
  if (typeof window.google === 'undefined' || typeof window.google.maps === 'undefined') {
    console.error('TravelTimeEstimator: Global Google Maps script not loaded yet.');
    error.value = 'Globálna mapa Google sa nenačítala.';
    isLoading.value = false;
    return;
  }

  // 2. Check if the required DirectionsService is available (means 'routes' library loaded)
  if (typeof window.google.maps.DirectionsService === 'undefined') {
    console.error('TravelTimeEstimator: Required Google Maps library ("routes") not included in the global script tag.');
    error.value = 'Potrebná knižnica mapy (routes) nebola načítaná.';
    isLoading.value = false;
    return;
  }

  isLoading.value = true;
  error.value = null;
  estimates.value = []; // Clear previous estimates

  try {
    // 3. Instantiate service and get status enum directly if not already done
    if (!directionsServiceInstance || !MapsDirectionsStatus) {
      console.log("TravelTimeEstimator: Using globally loaded DirectionsService.");
      directionsServiceInstance = new window.google.maps.DirectionsService();
      MapsDirectionsStatus = window.google.maps.DirectionsStatus;
    }

    // --- Prepare requests (logic remains the same) ---
    const modes: { modeKey: TravelMode; displayMode: string; icon: string }[] = [
      { modeKey: TravelMode.DRIVING, displayMode: 'Autom', icon: '🚗' },
      { modeKey: TravelMode.WALKING, displayMode: 'Pešo', icon: '🚶' },
      { modeKey: TravelMode.TRANSIT, displayMode: 'MHD', icon: '🚌' },
    ];

    const origin: google.maps.LatLngLiteral = { lat: props.originCoords.latitude, lng: props.originCoords.longitude };
    const destination: google.maps.LatLngLiteral = { lat: props.destinationCoords.latitude, lng: props.destinationCoords.longitude };

    const promises = modes.map(async ({ modeKey, displayMode, icon }) => {
      const request: google.maps.DirectionsRequest = {
        origin,
        destination,
        travelMode: modeKey // Use API value (DRIVING, WALKING, TRANSIT)
      };

      try {
        if (!directionsServiceInstance || !MapsDirectionsStatus) { // Extra safety check
          throw new Error("DirectionsService not initialized.");
        }
        // Use async/await with the instance
        const result = await directionsServiceInstance.route(request);

        const leg = result.routes?.[0]?.legs?.[0];
        if (leg?.duration?.text && leg?.distance?.text) {
          return { modeKey, displayMode, icon, durationText: leg.duration.text, distanceText: leg.distance.text };
        } else {
          console.warn(`Missing route leg/duration/distance for ${displayMode}. Leg:`, leg);
          return { modeKey, displayMode, icon, error: `Route data unavailable.` };
        }
      } catch (err: any) {
        console.error(`Error fetching route for ${displayMode}:`, err);
        let errorMsg = `Could not calculate time for ${displayMode.toLowerCase()} route.`;
        if (err?.code && MapsDirectionsStatus) {
          const status = err.code as google.maps.DirectionsStatus;
          console.warn(`Route request failed with status: ${status}`);
          if (status === MapsDirectionsStatus.ZERO_RESULTS) {
            errorMsg = `No ${displayMode.toLowerCase()} route found.`;
          } else {
            errorMsg = `Map service error (${status}).`;
          }
        }
        return { modeKey, displayMode, icon, error: errorMsg };
      }
    });

    estimates.value = await Promise.all(promises);

  } catch (loadError) { // Catch errors from checks or service instantiation
    console.error("Failed to use Google Maps services or get estimates:", loadError);
    error.value = "Could not load map services or calculate times.";
  } finally {
    isLoading.value = false;
  }
}

// --- Watcher ---
watch(
  [() => props.originCoords, () => props.destinationCoords],
  ([newOrigin, newDest], [oldOrigin, oldDest]) => {
    if (newOrigin && newDest) {
      const originChanged = JSON.stringify(newOrigin) !== JSON.stringify(oldOrigin);
      const destChanged = JSON.stringify(newDest) !== JSON.stringify(oldDest);

      if (originChanged || destChanged) {
        console.log('Coordinates changed, fetching new estimates...');
        loadMapsApiAndFetchEstimates();
        showMap.value = false;
        selectedModeKey.value = null;
      }
    } else {
      estimates.value = [];
      error.value = null;
      showMap.value = false;
      selectedModeKey.value = null;
    }
  },
  { deep: true }
);

// --- Lifecycle Hooks ---
onMounted(() => {
  // Attempt to load estimates on mount only if coordinates are already valid
  if (props.originCoords && props.destinationCoords) {
    loadMapsApiAndFetchEstimates();
  }
});
</script>

<template>
  <div class="travel-time-estimator p-4 border-t border-gray-200 bg-yellow-50">
    <h4 class="font-semibold text-gray-700 mb-3 text-center">Trasa</h4>
    <div v-if="isLoading" class="text-center text-gray-500 py-3">Vypočítavam...</div>
    <div v-else-if="error" class="text-center text-red-500 py-3">{{ error }}</div>
    <div v-else-if="!props.originCoords || !props.destinationCoords" class="text-center text-gray-400 text-xs py-3">Zadajte východzí a cieľový bod...</div>
    <div v-else-if="estimates.length === 0 && !isLoading" class="text-center text-gray-500 py-3">Žiadne odhady trasy.</div>
    <ul v-else class="space-y-2">
      <li
        v-for="est in estimates"
        :key="est.modeKey"
        class="flex justify-between items-center p-2 rounded hover:bg-gray-50 cursor-pointer transition-colors duration-150"
        :class="{'bg-blue-50 border border-blue-200': selectedModeKey === est.modeKey}"
        @click="toggleRouteMap(est.modeKey)"
      >
        <div class="flex items-center gap-2">
          <span class="text-xl w-6 text-center flex-shrink-0">{{ est.icon }}</span>
          <span class="font-medium text-gray-800">{{ est.displayMode }}</span>
        </div>
        <div v-if="est.durationText && !est.error" class="text-right flex-shrink-0 pl-2">
          <span class="font-medium text-sm md:text-base">{{ est.durationText }}</span>
          <span v-if="est.distanceText" class="text-xs text-gray-500 block">{{ est.distanceText }}</span>
        </div>
        <div v-else-if="est.error" class="text-xs text-red-500 text-right italic flex-shrink-0 pl-2">{{ est.error }}</div>
        <div v-else class="text-xs text-gray-400 text-right italic flex-shrink-0 pl-2">Nedostupné</div>
      </li>
    </ul>

    <!-- Map Container -->
    <div v-if="showMap && selectedModeKey" class="mt-4">
      <!-- apiKey prop REMOVED -->
      <RouteMapViewer
        :originCoords="props.originCoords"
        :destinationCoords="props.destinationCoords"
        :selectedMode="selectedModeKey"
      />
    </div>
  </div>
</template>