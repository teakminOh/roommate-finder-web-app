<template>
  <div class="rounded-lg shadow bg-white">
    <div class="flex flex-col sm:flex-row gap-4 items-end">
      <div class="flex-grow">
        
        <input
          :id="uniqueId('locationSearch')"
          v-model="internalAddress"
          type="text"
          :placeholder="placeholder"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <div class="w-full sm:w-auto">
        
        <select
          :id="uniqueId('radiusKm')"
          v-model.number="internalRadius"
          class="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
        >
          <option value="5">5 km</option>
          <option value="10">10 km</option>
          <option value="15">15 km</option>
          <option value="25">25 km</option>
          <option value="50">50 km</option>
          <option value="100">100 km</option>
        </select>
      </div>
    </div>
    <p v-if="geocodingError" class="text-red-500 text-sm mt-2">{{ geocodingError }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'; // Removed toRefs as it wasn't used
import { GeoPoint } from 'firebase/firestore';

// --- Props ---
const props = defineProps({
  initialAddress: {
    type: String,
    default: '',
  },
  initialRadius: {
    type: Number,
    default: 10,
  },
  googleMapsApiKey: {
    type: String,
    required: true,
  },
  placeholder: {
    type: String,
    default: 'Zadajte adresu alebo mesto',
  },
  idPrefix: {
    type: String,
    default: 'loc-search-'
  }
});

// --- Emits ---
const emit = defineEmits<{
  (e: 'update:location', payload: { address: string; radius: number; geoPoint: GeoPoint | null }): void
  (e: 'error', message: string): void
}>();

// --- Internal State ---
const internalAddress = ref(props.initialAddress);
const internalRadius = ref(props.initialRadius);
const geocodingError = ref<string | null>(null);
// **NEW**: Store the last successfully geocoded point for the current internalAddress
const lastKnownGeoPointForCurrentAddress = ref<GeoPoint | null>(null);

// --- Google Maps Services ---
let geocoderService: google.maps.Geocoder | null = null;
let autocompleteService: google.maps.places.Autocomplete | null = null;

const uniqueId = (suffix: string) => `${props.idPrefix}${suffix}`;

const initializeGoogleMapsServices = () => {
  if (window.google && window.google.maps && window.google.maps.places) {
    geocoderService = new google.maps.Geocoder();
    const inputElement = document.getElementById(uniqueId('locationSearch')) as HTMLInputElement;
    if (inputElement) {
      autocompleteService = new google.maps.places.Autocomplete(inputElement, {
        types: ['geocode'],
        componentRestrictions: { country: 'sk' },
      });
      autocompleteService.addListener('place_changed', handlePlaceChanged);
    } else {
      console.warn(`LocationSearchInput: Input field (id='${uniqueId('locationSearch')}') not found.`);
      emit('error', `Chyba: Vstupný element pre adresu nebol nájdený.`);
    }
  } else {
    console.error("LocationSearchInput: Google Maps API not fully loaded.");
    emit('error', 'Mapové služby sa nepodarilo načítať.');
  }
};

const loadGoogleMapsScript = () => {
  if (!props.googleMapsApiKey) {
    emit('error', 'Chýba API kľúč pre mapové služby.');
    return;
  }
  if (window.google && window.google.maps && window.google.maps.places && window.google.maps.Geocoder) {
    initializeGoogleMapsServices();
    return;
  }
  const scriptId = 'google-maps-component-script';
  if (document.getElementById(scriptId)) return;

  (window as any)[`${props.idPrefix}initMaps`] = initializeGoogleMapsServices;

  const script = document.createElement('script');
  script.id = scriptId;
  script.src = `https://maps.googleapis.com/maps/api/js?key=${props.googleMapsApiKey}&libraries=places,geocoding&callback=${props.idPrefix}initMaps`;
  script.async = true;
  script.defer = true;
  script.onerror = () => {
    emit('error', 'Nepodarilo sa načítať skript pre mapové služby.');
  };
  document.head.appendChild(script);
};

const handlePlaceChanged = () => {
  if (!autocompleteService) return;
  const place = autocompleteService.getPlace();
  let newAddress = '';
  if (place && place.formatted_address) {
    newAddress = place.formatted_address;
  } else if (place && place.name) {
    newAddress = place.name;
  }

  if (newAddress) {
    internalAddress.value = newAddress;
    lastKnownGeoPointForCurrentAddress.value = null; // **MODIFIED**: Clear old GeoPoint when address changes
    triggerLocationUpdate(newAddress, internalRadius.value, false); // **MODIFIED**: Pass false
  }
};

let geocodeDebounceTimer: NodeJS.Timeout;
// **MODIFIED**: Added third parameter
const triggerLocationUpdate = (address: string, radius: number, useLastKnownGeoPointIfAddressUnchanged = false) => {
  clearTimeout(geocodeDebounceTimer);
  geocodeDebounceTimer = setTimeout(async () => {
    if (!geocoderService) {
      emit('error', 'Služba geokódovania nie je pripravená.');
      return;
    }
    if (!address || address.trim() === '') {
      geocodingError.value = null;
      lastKnownGeoPointForCurrentAddress.value = null; // **MODIFIED**: Clear if address is empty
      emit('update:location', { address: '', radius: radius, geoPoint: null });
      return;
    }

    geocodingError.value = null;

    // **MODIFIED**: Check if we can use the cached GeoPoint
    if (useLastKnownGeoPointIfAddressUnchanged && lastKnownGeoPointForCurrentAddress.value && internalAddress.value === address) {
        console.log("LocationSearchInput: Using last known GeoPoint for address:", address);
        emit('update:location', { address: internalAddress.value, radius: radius, geoPoint: lastKnownGeoPointForCurrentAddress.value });
        return;
    }

    // Proceed with geocoding
    try {
      const response = await geocoderService.geocode({ address: address, componentRestrictions: { country: 'SK' } });
      if (response.results && response.results.length > 0) {
        const location = response.results[0].geometry.location;
        const geoPoint = new GeoPoint(location.lat(), location.lng());
        const bestResultAddress = response.results[0].formatted_address || address;

        if (internalAddress.value !== bestResultAddress) {
          internalAddress.value = bestResultAddress;
        }
        lastKnownGeoPointForCurrentAddress.value = geoPoint; // **MODIFIED**: Store the new GeoPoint

        emit('update:location', { address: bestResultAddress, radius: radius, geoPoint: geoPoint });
      } else {
        geocodingError.value = `Nepodarilo sa nájsť adresu: "${address}"`;
        lastKnownGeoPointForCurrentAddress.value = null; // **MODIFIED**: Clear on failure
        emit('update:location', { address: address, radius: radius, geoPoint: null });
      }
    } catch (error) {
      console.error('LocationSearchInput Geocoding error:', error);
      geocodingError.value = 'Chyba pri geokódovaní adresy.';
      lastKnownGeoPointForCurrentAddress.value = null; // **MODIFIED**: Clear on error
      emit('error', 'Chyba pri geokódovaní adresy.');
      emit('update:location', { address: address, radius: radius, geoPoint: null });
    }
  }, 300);
};

watch(() => props.initialAddress, (newVal) => {
  if (newVal !== internalAddress.value) {
    internalAddress.value = newVal;
    lastKnownGeoPointForCurrentAddress.value = null; // If initial prop changes, force re-geocode
    // Trigger geocoding if initial prop changes after mount and is not empty
    if (newVal && newVal.trim()) {
        triggerLocationUpdate(newVal, internalRadius.value, false);
    } else if (!newVal) { // If initial address is cleared
        triggerLocationUpdate('', internalRadius.value, false);
    }
  }
});

watch(() => props.initialRadius, (newVal) => {
  if (newVal !== internalRadius.value) {
    internalRadius.value = newVal;
    // If address is already set, emit update with new radius, using cached GeoPoint
    if (internalAddress.value && internalAddress.value.trim()) {
        triggerLocationUpdate(internalAddress.value, newVal, true); // **MODIFIED**: Pass true
    }
  }
});

let manualInputDebounceTimer: NodeJS.Timeout;
watch(internalAddress, (newAddress, oldAddress) => {
    const place = autocompleteService?.getPlace();
    const placeAddress = place?.formatted_address || place?.name;

    if (newAddress !== oldAddress && newAddress !== placeAddress && newAddress !== props.initialAddress) {
        clearTimeout(manualInputDebounceTimer);
        manualInputDebounceTimer = setTimeout(() => {
            lastKnownGeoPointForCurrentAddress.value = null; // **MODIFIED**: Clear old GeoPoint for manual address change
            triggerLocationUpdate(newAddress, internalRadius.value, false); // **MODIFIED**: Pass false
        }, 1000);
    }
});

// **MODIFIED**: Watch internalRadius to call triggerLocationUpdate correctly
watch(internalRadius, (newRadius, oldRadius) => {
  if (newRadius !== oldRadius && internalAddress.value && internalAddress.value.trim()) {
    // When only the radius changes, try to use the last known GeoPoint
    triggerLocationUpdate(internalAddress.value, newRadius, true);
  }
});

onMounted(() => {
  loadGoogleMapsScript();
  internalAddress.value = props.initialAddress;
  internalRadius.value = props.initialRadius;
  // If there's an initial address, geocode it on mount
  if (props.initialAddress && props.initialAddress.trim()) {
    lastKnownGeoPointForCurrentAddress.value = null; // Ensure fresh geocode on mount for initialAddress
    triggerLocationUpdate(props.initialAddress, props.initialRadius, false);
  }
});
</script>