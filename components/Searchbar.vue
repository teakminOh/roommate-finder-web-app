<template>
  <div class="relative max-w-lg mx-auto" :style="{ marginTop: addMarginTop ? '150px' : '50px' }">
    <!-- Mascot Image positioned to overlap with the search bar -->
    <div v-if="showMascot" class="absolute w-full flex justify-center" style="top: -120px;">
      <img src="/images/TobyLooking.png" alt="Toby Mascot" class="w-48 h-auto z-10" />
    </div>

    <!-- Search Form -->
    <div
      class="bg-gray-100 p-6 rounded-lg shadow-xl relative z-10"
      :class="{ 'mt-16': showMascot }"
    >
      <h2 class="text-2xl font-bold mb-6 text-center text-blue-900">
        {{ searchType === 'rooms' ? 'Nájdi si Izbu!' : 'Nájdi Spolubývajúceho!' }}
      </h2>

      <!-- Search Type Selection -->
      <div class="mb-5 flex flex-wrap justify-center gap-2 space-x-4">
        <label
          v-for="option in searchOptions"
          :key="option.value"
          class="flex items-center px-4 py-2 border rounded-md cursor-pointer transition-all duration-200 ease-in-out"
          :class="{
            'bg-blue-600 text-white border-blue-600 shadow-md': searchType === option.value,
            'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:shadow-sm': searchType !== option.value
          }"
        >
          <input
            type="radio"
            :id="`searchType-${option.value}`"
            name="searchType"
            :value="option.value"
            v-model="searchType"
            class="opacity-0 w-0 h-0 absolute"
          />
          <component :is="option.icon" class="w-5 h-5 mr-2" />
          <span>{{ option.label }}</span>
        </label>
      </div>

      <form @submit.prevent="handleSearch" class="relative">
        <!-- Input Wrapper -->
        <div class="flex items-center border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 transition shadow-sm">
          <!-- Input Field -->
          <input
            id="autocomplete"
            v-model="searchQuery"
            type="text"
            placeholder="Zadajte adresu, mesto alebo lokalitu"
            class="w-full px-4 py-3 rounded-l-md focus:outline-none text-gray-700"
            @focus="inputFocused = true"
            @blur="inputFocused = false"
          />
          <!-- Search Button -->
          <button
            type="submit"
            class="bg-blue-600 text-white px-5 py-3 rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200"
            aria-label="Hľadať"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M21 21l-4.35-4.35M15.5 10.5a5 5 0 1 0-10 0 5 5 0 0 0 10 0z"
              />
            </svg>
          </button>
        </div>
      </form>
       <p v-if="!searchQuery && submittedOnce && !inputFocused" class="text-red-500 text-sm mt-2 text-center">
        Prosím, zadajte lokalitu pre vyhľadávanie.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { HomeIcon, UsersIcon } from '@heroicons/vue/24/outline'; // Example icons

const props = defineProps({
  showMascot: {
    type: Boolean,
    default: true,
  },
  addMarginTop: {
    type: Boolean,
    default: true,
  }
});


const searchQuery = ref('');
const searchType = ref('rooms'); // Default search type
const router = useRouter();
const inputFocused = ref(false);
const submittedOnce = ref(false);


const searchOptions = [
  { value: 'rooms', label: 'Izby', icon: HomeIcon },
  { value: 'roommates', label: 'Spolubývajúci', icon: UsersIcon },
];

onMounted(() => {
  const input = document.getElementById('autocomplete');
  if (!input) {
    console.error("Autocomplete input field not found");
    return;
  }

  const initializeAutocomplete = () => {
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

  if (window.google && window.google.maps && window.google.maps.places) {
    initializeAutocomplete();
  } else {
    const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!mapsApiKey) {
      console.error("Google Maps API key is missing.");
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsApiKey}&libraries=places&callback=initAutocomplete`;
    script.async = true;
    script.defer = true;
    // Make initializeAutocomplete globally accessible for the JSONP callback
    window.initAutocomplete = initializeAutocomplete;
    document.head.appendChild(script);
  }
});

const handleSearch = () => {
  submittedOnce.value = true; // Mark that a search attempt has been made
  if (searchQuery.value.trim()) {
    let path = '/'; // Default path, should be updated
    if (searchType.value === 'rooms') {
      path = '/searchroom';
    } else if (searchType.value === 'roommates') {
      path = '/searchuser';
    } else {
      console.warn('Unknown search type:', searchType.value);
      return; // Or redirect to a generic page or show an error
    }

    router.push({
      path: path,
      query: { address: searchQuery.value.trim() },
    });
  } else {
    console.log('No address provided');
    // Optionally, focus the input or show a more prominent message
    const inputEl = document.getElementById('autocomplete');
    if (inputEl) inputEl.focus();
  }
};
</script>

<style scoped>
/* Ensure Google autocomplete dropdown is visible above other elements */
.pac-container {
    z-index: 1050 !important; /* Adjust if necessary, should be higher than your component's z-index */
    /* Tailwind's z-10 is 10, z-20 is 20 etc. Max is z-50 (50) by default.
       So 1050 should be plenty, unless you have other very high z-index elements. */
}
</style>