<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
// NO import { Loader } from '@googlemaps/js-api-loader'; // <-- REMOVED

// --- Type Imports ---
/// <reference types="@types/google.maps" />

// --- Props ---
const props = defineProps<{
  originCoords: { latitude: number; longitude: number } | null;
  destinationCoords: { latitude: number; longitude: number } | null;
  selectedMode: string | null;
  // apiKey: string; // <-- REMOVED (Handled by global script)
}>();

// --- State ---
const mapContainerRef = ref<HTMLElement | null>(null);
const isLoading = ref(false); // Still useful for the route calculation phase
const error = ref<string | null>(null);
const isInitializing = ref(false); // Flag to prevent concurrent init attempts

// --- Google Maps Instances ---
let mapInstance: google.maps.Map | null = null;
let directionsServiceInstance: google.maps.DirectionsService | null = null;
let directionsRendererInstance: google.maps.DirectionsRenderer | null = null;
let MapsDirectionsStatus: typeof google.maps.DirectionsStatus | null = null;

// --- Methods ---
async function initMapAndServices() {
  // Guard clauses
  if (isInitializing.value || mapInstance) { // Prevent re-run
      console.log("Initialization skipped (already running or complete).");
      if (mapInstance && props.originCoords && props.destinationCoords && props.selectedMode) {
          await displayRoute(); // Ensure route updates if props changed before init finished
      }
      return;
  }
  isInitializing.value = true;
  error.value = null;

  await nextTick(); // Ensure DOM element ref is available

  if (!mapContainerRef.value) {
    console.error("Map container element not found.");
    error.value = "Map container element is missing.";
    isInitializing.value = false;
    return;
  }

  // 1. Check if the global Google Maps script has loaded
  if (typeof window.google === 'undefined' || typeof window.google.maps === 'undefined') {
    console.error('Global Google Maps script not loaded yet.');
    error.value = 'Globálna mapa Google sa nenačítala.';
    isInitializing.value = false;
    return;
  }

  // 2. Access needed classes directly from the global namespace
  // Make sure 'routes' library was included in nuxt.config.ts script tag!
  if (typeof window.google.maps.DirectionsService === 'undefined' || typeof window.google.maps.DirectionsRenderer === 'undefined') {
      console.error('Required Google Maps library (e.g., "routes") not included in the global script tag in nuxt.config.ts.');
      error.value = 'Potrebná knižnica mapy (routes) nebola načítaná.';
      isInitializing.value = false;
      return;
  }
  const Map = window.google.maps.Map;
  const DirectionsService = window.google.maps.DirectionsService;
  const DirectionsRenderer = window.google.maps.DirectionsRenderer;
  MapsDirectionsStatus = window.google.maps.DirectionsStatus; // Store enum

  //isLoading.value = true; // Keep loading true until map is usable

  try {
    console.log("Using globally loaded Google Maps libraries.");

    const defaultCenter = { lat: 48.7139, lng: 19.1544 }; // Slovakia center
    const center = props.originCoords
      ? { lat: props.originCoords.latitude, lng: props.originCoords.longitude }
      : defaultCenter;

    // Create map instance
    mapInstance = new Map(mapContainerRef.value, {
      center,
      zoom: 12, // Adjust zoom as needed
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      mapId: 'ROUTE_MAP_VIEWER_MAP'
    });
    console.log("Map instance created using global script.");

    // Create directions service and renderer instances
    directionsServiceInstance = new DirectionsService();
    directionsRendererInstance = new DirectionsRenderer({
      map: mapInstance,
      suppressMarkers: false,
    });
    console.log("DirectionsService and DirectionsRenderer initialized.");

    // Display initial route if props are valid
    if (props.originCoords && props.destinationCoords && props.selectedMode) {
      await displayRoute(); // displayRoute now manages its own loading state
    }

  } catch (err: any) {
    console.error("Error initializing map or services using global script:", err);
    error.value = `Could not initialize map services: ${err.message}`;
    mapInstance = null; // etc.
  } finally {
    isInitializing.value = false;
    // isLoading.value = false; // Set loading false only after potential initial route display
  }
}

async function displayRoute() {
  if (!mapInstance || !directionsRendererInstance || !directionsServiceInstance || !MapsDirectionsStatus) {
    // Don't set error here if init is still running or failed - init handles that
    if (!isInitializing.value) {
        error.value = "Map services are not ready to display route.";
        console.warn("Attempted displayRoute when services not ready.");
    }
    return;
  }
  if (!props.originCoords || !props.destinationCoords || !props.selectedMode) {
    resetMap(); return;
  }

  isLoading.value = true; // Use isLoading for the route calculation phase
  error.value = null;

  try {
    const origin = { lat: props.originCoords.latitude, lng: props.originCoords.longitude };
    const destination = { lat: props.destinationCoords.latitude, lng: props.destinationCoords.longitude };
    // Ensure selectedMode matches enum values ('DRIVING', 'WALKING', etc.)
    const travelMode = props.selectedMode.toUpperCase() as google.maps.TravelMode;

     // Validate travelMode before making the request
     const validModes = Object.values(google.maps.TravelMode);
     if (!validModes.includes(travelMode)) {
         throw new Error(`Invalid travel mode: ${props.selectedMode}`);
     }


    const request: google.maps.DirectionsRequest = { origin, destination, travelMode };

    console.log(`Requesting directions for mode: ${travelMode}`);
    const result = await directionsServiceInstance.route(request); // Throws on non-OK status now

    console.log("Directions received successfully.");
    directionsRendererInstance.setDirections(result);

  } catch (err: any) {
     console.error("Error fetching or displaying route:", err);
    let errorMsg = `Error calculating ${props.selectedMode.toLowerCase()} route.`;
    // Check if it's a google.maps.MapsRequestError-like object
    if (err && typeof err === 'object' && err.code && MapsDirectionsStatus) {
      const status = err.code as google.maps.DirectionsStatus;
       if (status === MapsDirectionsStatus.ZERO_RESULTS) {
        errorMsg = `Could not find a ${props.selectedMode.toLowerCase()} route.`;
      } else {
        errorMsg = `Route request failed (${status}).`;
      }
    } else if (err instanceof Error) {
       errorMsg = `Could not display route: ${err.message}`; // Handle other errors like invalid mode
    }
    error.value = errorMsg;
    resetMap();
  } finally {
    isLoading.value = false; // Loading finished (success or fail)
  }
}

function resetMap() {
  if (directionsRendererInstance) {
    directionsRendererInstance.setDirections(null);
  }
  // Do not reset error here, let new actions clear it
}

// --- Watchers ---
watch(
  [() => props.originCoords, () => props.destinationCoords, () => props.selectedMode],
  async ([newOrigin, newDest, newMode], [oldOrigin, oldDest, oldMode]) => {
    await nextTick();

    if (newOrigin && newDest && newMode) {
       if (mapInstance) {
         // Map ready, just update route
        await displayRoute();
      } else if (!isInitializing.value && !error.value) {
         // Map not ready, not initializing, and no prior errors, attempt init
        console.log("Map not ready, attempting initialization...");
        await initMapAndServices();
         // initMapAndServices will call displayRoute if successful and props are valid
      } else {
          console.log("Map not ready (still initializing or error occurred). Cannot display route yet.");
      }
    } else if (mapInstance) {
      // Props became invalid, clear route but keep map
      resetMap();
       error.value = null; // Clear route-specific errors
    }
  },
  { deep: true }
);

// --- Lifecycle Hooks ---
onMounted(async () => {
  console.log("RouteMapViewer mounted. Initializing map and services.");
  await nextTick(); // Ensure DOM element exists before init
  initMapAndServices();
});

onUnmounted(() => {
  console.log("RouteMapViewer unmounted. Cleaning up.");
  if (directionsRendererInstance) {
    directionsRendererInstance.setMap(null); // Important for cleanup
  }
  directionsRendererInstance = null;
  directionsServiceInstance = null;
  mapInstance = null; // Allow Vue/JS to GC the map object
});

</script>

<template>
  <div class="route-map-viewer relative">
    <!-- Loading Overlay: Show during init OR route calculation -->
    <div v-if="isLoading || isInitializing" class="map-loading-overlay">
      <div class="loading-spinner">
          {{ isInitializing ? 'Initializing Map...' : 'Calculating Route...' }}
      </div>
    </div>

    <!-- Error Display: Show only if NOT loading -->
    <div v-if="error && !(isLoading || isInitializing)" class="map-error">
      {{ error }}
    </div>

    <!-- Map Container -->
    <div
      ref="mapContainerRef"
      class="map-container h-64 w-full rounded-lg shadow-md bg-gray-200"
      :class="{ 'opacity-50': isLoading || isInitializing || error }"
    >
      <!-- Placeholder shown before map is created AND not loading/errored -->
       <div v-if="!mapInstance && !(isLoading || isInitializing) && !error" class="flex items-center justify-center h-full text-gray-400 text-sm italic">
            Waiting for Map...
       </div>
    </div>
  </div>
</template>

<style scoped>
/* ... styles remain the same ... */
.route-map-viewer {
  position: relative;
  min-height: 16rem;
}
.map-container {
  background-color: #e5e7eb;
  transition: opacity 0.3s ease-in-out;
}
.map-loading-overlay,
.map-error {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  display: flex; justify-content: center; align-items: center;
  z-index: 10;
  pointer-events: none;
  border-radius: 0.5rem;
}
.map-loading-overlay {
  background-color: rgba(255, 255, 255, 0.6);
}
.loading-spinner {
  padding: 0.75rem 1.5rem;
  background-color: white;
  border-radius: 0.25rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  color: #4b5563;
  font-size: 0.875rem;
}
.map-error {
   background-color: rgba(254, 226, 226, 0.9);
   padding: 0.75rem 1.5rem;
   border-radius: 0.25rem;
   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
   color: #b91c1c;
   font-size: 0.875rem;
   text-align: center;
   border: 1px solid #fecaca;
   pointer-events: auto; /* Allow interaction with error message if needed */
}
.map-container.opacity-50 {
    opacity: 0.5;
}
</style>