<template>
  <div class="bg-gray-100 p-6 rounded-md shadow-md max-w-lg mx-auto mt-10">
    <!-- Search Form -->
    <h2 class="text-2xl font-bold mb-4 text-center text-blue-900">Nájdi svoju nehnuteľnosť</h2>
    <form @submit.prevent="handleSearch" class="relative">
      <!-- Input Wrapper -->
      <div
        class="flex items-center border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-400 transition"
      >
        <!-- Input Field -->
        <input
          id="autocomplete"
          type="text"
          placeholder="Zadajte adresu alebo lokalitu"
          class="w-full px-4 py-2 rounded-l-md focus:outline-none"
        />
        <!-- Search Button -->
        <button
          type="submit"
          class="text-black px-4 py-2 rounded-r-md hover:bg-blue-100"
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const searchQuery = ref('');
const router = useRouter();

onMounted(() => {
  const input = document.getElementById('autocomplete');

  // Function to initialize Google Maps Autocomplete
  const initializeAutocomplete = () => {
    if (window.google && window.google.maps) {
      const autocomplete = new google.maps.places.Autocomplete(input, {
        types: ['geocode'], // Restrict search results to addresses
        componentRestrictions: { country: 'sk' }, // Restrict to Slovakia
      });

      // Handle address selection
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place && place.formatted_address) {
          searchQuery.value = place.formatted_address;

          // Immediately navigate to /buy with the selected address
          handleSearch();
        }
      });
    }
  };

  // Check if Google Maps script is already loaded
  if (window.google && window.google.maps) {
    initializeAutocomplete();
  } else {
    // Dynamically load the script if not loaded
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NUXT_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = initializeAutocomplete; // Initialize once script is loaded
    document.head.appendChild(script);
  }
});

// Handle the form submission
const handleSearch = () => {
  if (searchQuery.value.trim()) {
    router.push({
      path: '/buy',
      query: { address: searchQuery.value.trim() },
    });
  } else {
    console.log('No address provided');
  }
};
</script>

<style scoped>
/* Prispôsobenie vzhľadu */
</style>
