<template>
  <div id = 'app'>
    <!-- Map Container -->
    <div id="map" class="w-full border border-gray-300 rounded-md"></div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRoute } from 'nuxt/app';

let map; // Declare map globally
let geocoder; // Declare geocoder globally

const route = useRoute();

onMounted(() => {
  const initMap = () => {
    geocoder = new google.maps.Geocoder();

    map = new google.maps.Map(document.getElementById('map'), {
      mapId: process.env.NUXT_MAP_ID, // Use Map ID if configured
      center: { lat: 48.6737532, lng: 19.696058 }, // Default center
      zoom: 8, // Default zoom
    });

    const address = route.query.address;

    if (address) {
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;

          // Update map center and zoom level dynamically
          map.setCenter(location);
          map.setZoom(14); // Adjust zoom level to show the area
        } else {
          console.error('Geocode was not successful: ' + status);
          alert('Unable to find the location. Please check the address.');
        }
      });
    } else {
      alert('No address provided!');
    }
  };

  if (window.google && window.google.maps) {
    initMap();
  } else {
    console.error('Google Maps API is not loaded.');
  }
});
</script>

<style scoped>
#map {
  width: 100%;
  height: 100vh; /* Full viewport height */
}
</style>
