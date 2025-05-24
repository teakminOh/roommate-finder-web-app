<!-- GooglePlacesLocation.vue -->
<template>
  <div class="relative">
    <label v-if="label" :for="id" class="block text-sm font-medium text-gray-700 mb-1">{{ label }}</label>
    <div v-if="!isEditing">
      <strong>{{ labelText }}:</strong>
      <p>{{ modelValue || placeholder }}</p>
    </div>
    <div v-else class="relative">
      <input
        :id="id"
        ref="autocompleteInput"
        type="text"
        :placeholder="placeholder"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
      />
      <div v-if="loading" class="absolute right-3 top-1/2 transform -translate-y-1/2">
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
      </div>
    </div>
    <p v-if="error" class="mt-1 text-sm text-red-600">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, defineProps, defineEmits } from 'vue';
import { useRuntimeConfig } from '#app'; // Import useRuntimeConfig for Nuxt 3

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  labelText: {
    type: String,
    default: 'Požadovaná Lokalita'
  },
  placeholder: {
    type: String,
    default: 'Neuvedená'
  },
  isEditing: {
    type: Boolean,
    default: false
  },
  id: {
    type: String,
    default: 'location-autocomplete'
  }
});

const emit = defineEmits(['update:modelValue']);

const config = useRuntimeConfig(); // Get runtime config
const googleMapsApiKey = config.public.googleMapsApiKey;

const autocompleteInput = ref(null);
const loading = ref(false);
const error = ref('');
let autocomplete = null;
let placesApiLoaded = false;

// Check if the Google Maps API is already loaded
const isGoogleMapsLoaded = () => {
  return typeof google !== 'undefined' && google.maps && google.maps.places;
};

// Load Google Maps API script
const loadGoogleMapsApi = () => {
  if (!googleMapsApiKey) {
    error.value = 'Google Maps API key is not configured. Please check your Nuxt runtime config.';
    console.error('Google Maps API key is missing in runtimeConfig.public.googleMapsApiKey');
    loading.value = false;
    return;
  }

  if (isGoogleMapsLoaded()) {
    placesApiLoaded = true;
    initAutocomplete();
    return;
  }

  loading.value = true;

  // Check if the script is already being loaded
  const existingScript = document.getElementById('google-maps-api');
  if (existingScript) {
    // If script exists, it might be loading or loaded.
    // Add event listener for 'load' to ensure we proceed after it's fully loaded.
    const handleExistingScriptLoad = () => {
      placesApiLoaded = true;
      loading.value = false;
      initAutocomplete();
      existingScript.removeEventListener('load', handleExistingScriptLoad);
      existingScript.removeEventListener('error', handleExistingScriptError);
    };
    const handleExistingScriptError = () => {
      loading.value = false;
      error.value = 'Failed to load Google Maps API (existing script error).';
      existingScript.removeEventListener('load', handleExistingScriptLoad);
      existingScript.removeEventListener('error', handleExistingScriptError);
    };

    // Check if the script has already loaded by checking for the callback
    if (window.initGoogleMaps && typeof google !== 'undefined' && google.maps) {
      handleExistingScriptLoad();
    } else {
      existingScript.addEventListener('load', handleExistingScriptLoad);
      existingScript.addEventListener('error', handleExistingScriptError);
    }
    return;
  }

  const script = document.createElement('script');
  script.id = 'google-maps-api';
  // Use the API key from runtimeConfig
  script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places&callback=initGoogleMaps`;
  script.async = true;
  script.defer = true;

  // Define the callback function in the global scope
  window.initGoogleMaps = () => {
    console.log('Google Maps API loaded via callback.');
    placesApiLoaded = true;
    loading.value = false;
    initAutocomplete();
    // Clean up the global callback to prevent issues if this component is mounted multiple times
    // or if other components also try to define it.
    // However, if multiple instances might load the script, this could be problematic.
    // A more robust solution would be a shared service/plugin to manage script loading.
    // delete window.initGoogleMaps;
  };

  script.onerror = () => {
    loading.value = false;
    error.value = 'Failed to load Google Maps API. Check your API key and network connection.';
    console.error('Error loading Google Maps API script.');
  };

  document.head.appendChild(script);
};

// Initialize Google Places Autocomplete
const initAutocomplete = () => {
    if (window.google && window.google.maps && window.google.maps.places) {
      const autocomplete = new google.maps.places.Autocomplete(input, {
        types: ['geocode'],
        componentRestrictions: { country: 'sk' },
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place && place.formatted_address) {
          searchQuery.value = place.formatted_address;
          handleSearch(); // Automatically search when a place is selected
        } else if (place && place.name) {
          // Fallback for general locations that might not have formatted_address
          searchQuery.value = place.name;
           handleSearch();
        }
      });
    } else {
      console.error("Google Maps Places API not loaded correctly.");
    }
  };
// Watch for editing state changes
watch(() => props.isEditing, (newVal, oldVal) => {
  if (newVal && !oldVal) { // Switched to editing mode
    if (!placesApiLoaded) {
      loadGoogleMapsApi(); // Load API if not already loaded
    } else {
      // API is loaded, ensure autocomplete is initialized for the input
      // Use nextTick or setTimeout to ensure the input element is visible and ready
      setTimeout(() => {
        if (autocompleteInput.value) {
          initAutocomplete();
        } else {
            console.warn("Autocomplete input ref not available when trying to init on edit.")
        }
      }, 100); // Small delay for DOM updates
    }
  } else if (!newVal && autocomplete) {
    // Optionally clean up autocomplete when exiting edit mode if it causes issues
    // google.maps.event.clearInstanceListeners(autocomplete);
    // autocomplete = null;
  }
});

onMounted(() => {
  if (props.isEditing) {
    loadGoogleMapsApi();
  }
});

onBeforeUnmount(() => {
  // Clean up the autocomplete instance and listeners
  if (autocomplete && typeof google !== 'undefined' && google.maps && google.maps.event) {
    google.maps.event.clearInstanceListeners(autocomplete);
  }
  autocomplete = null; // Ensure it's nullified

  // Optional: Remove the script if this is the last component instance using it
  // and if window.initGoogleMaps was component-specific.
  // This is complex to manage correctly if multiple instances exist.
  // For simplicity, often the script is left, or a more global script loading management is used.
  // if (window.initGoogleMaps) {
  //   delete window.initGoogleMaps;
  // }
});
</script>