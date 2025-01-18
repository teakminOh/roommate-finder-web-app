<template>
  <div class="bg-gray-100 p-6 rounded-md shadow-md max-w-lg mx-auto mt-10">
    <!-- Search Form -->
    <h2 class="text-2xl font-bold mb-4 text-center text-blue-900">Nájdi svoju nehnuteľnosť</h2>
    <form @submit.prevent="handleSearch" class="flex items-center relative">
      <!-- Input Field -->
      <input
        id="autocomplete"
        type="text"
        placeholder="Zadajte adresu alebo lokalitu"
        class="w-full px-4 py-2 rounded-l-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <!-- Search Button -->
      <button
        type="submit"
        class="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600 transition"
      >
        Hľadaj
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'nuxt/app';

const searchQuery = ref('');
const router = useRouter();

onMounted(() => {
  const input = document.getElementById('autocomplete');

  // Function to initialize Google Maps Autocomplete
  const initializeAutocomplete = () => {
    if (window.google && window.google.maps) {
      const autocomplete = new google.maps.places.Autocomplete(input, {
        types: ['geocode'], // Restrict search results to addresses
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place && place.formatted_address) {
          searchQuery.value = place.formatted_address;
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
    alert('Please select an address before searching!');
  }
};
</script>



<style scoped>
/* Prispôsobenie vzhľadu */
</style>
