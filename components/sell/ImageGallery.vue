<template>
  <div v-if="imageUrls.length" class="grid grid-cols-2 gap-4 mt-4">
    <img 
      v-for="(url, index) in imageUrls" 
      :key="index" 
      :src="url" 
      alt="Uploaded Image" 
      class="w-full h-auto rounded"
    />
  </div>
</template>

<script setup>
defineProps({
  imageUrls: {
    type: Array,
    default: () => [],
  },
})
</script>