<template>
  <div class = "mt-20">
    <h1>Uploaded Images</h1>
    <ImageUpload />
    <div v-if="images.length > 0" v-for="image in images" :key="image._id">
      <img :src="image.url" alt="Stored Image" @error="handleImageError(image)" />
    </div>
    <p v-else>No images found.</p>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'onlynav',
});

const images = ref([]);
const errorMessage = ref(null);

async function fetchImages() {
  try {
    console.log('Fetching images from /api/get-images...');
    const response = await $fetch('/api/get-images');
    console.log('Fetched images:', response);
    images.value = response || [];
  } catch (e) {
    console.error('Failed to fetch images:', e);
    errorMessage.value = 'Failed to load images. Check the console for details.';
    images.value = []; // Ensure images is defined even on failure
  }
}

function handleImageError(image) {
  console.error('Image failed to load:', image.url);
}

onMounted(() => {
  console.log('Page mounted, fetching images...');
  fetchImages();
});
</script>