<template>
    <div v-if="isOpen" class="fixed inset-0 bg-black/60 flex justify-center items-center z-50" @click="closeModal">
      <div class="bg-white p-8 pt-0 w-2/3 h-screen overflow-y-auto relative m-8" @click.stop>
            <!-- Back Button -->
                    <button
            @click="$emit('close')"
            class="m-2 -ml-4 -mb-2 flex justify-center items-center gap-2 text-gray-900 hover:underline  pr-3 pl-1 py-1.5"
                    >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1"
            >
              <path d="M15 18l-6-6 6-6"/>
            </svg>
            <span>Back</span>
                    </button>
            <!-- Thumbnails -->
            <div class="relative grid grid-cols-[2fr_1fr_1fr] grid-rows-[auto_auto] mt-4">
              <div
                v-for="(image, index) in displayedImages"
                :key="index"
                class="relative aspect-square overflow-hidden cursor-pointer p-1"
                :style="index === 0 ? 'grid-row: span 2;' : ''"
                @click="showFullGallery = true"
              >
                <!-- Image Container -->
                <div class="relative w-full h-full">
                  <img
                    :src="image.url"
                    :alt="`Thumbnail ${index + 1}`"
                    loading="lazy"
                    class="w-full h-full object-cover transition-transform duration-200"
                  />
                  <!-- Dark Overlay on Hover -->
                  <div class="absolute top-0 left-0 w-full h-full bg-black/50 opacity-0 hover:opacity-100 transition-all duration-200"></div>
                </div>
              </div>

              <!-- See All Photos Button (Placed Over the Last Thumbnail) -->
              <div v-if="processedImages.length > 5" class="absolute bottom-2 right-2">
                <button
                  @click="showFullGallery = true"
                  class="relative z-10 rounded-md text-black border border-black p-3 m-2 flex items-center justify-center gap-2 font-medium bg-white hover:bg-black/85 hover:text-white transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none" 
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  Všetky fotky ({{ processedImages.length }})
                </button>
              </div>
            </div>

  
        <div class="flex-col">
          <h2 class="text-xl font-bold mt-6">{{ property.title }}</h2>
          <p class="text-gray-600">{{ property.fullDescription }}</p>
          <p class="text-blue-500 font-semibold mt-2">{{ property.price }}</p>
        </div>
  
      </div>
    </div>
  
    <!-- Full Gallery Modal -->
    <FullGallery
      v-if="showFullGallery"
      :images="processedImages"
      @close="showFullGallery = false"
    />
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, computed } from 'vue';
  import FullGallery from './FullGallery.vue';
  
  interface Property {
    title: string;
    fullDescription: string;
    price: string;
    images: string[];
  }
  
  const props = defineProps<{
    property: Property;
    isOpen: boolean;
  }>();
  
  const emit = defineEmits(['close']);
  const showFullGallery = ref(false);
  const processedImages = ref<Array<{ url: string; width: number; height: number }>>([]);
  
  const displayedImages = computed(() => {
    return processedImages.value.slice(0, 5);
  });
  
  const loadImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = url;
    });
  };
  
  onMounted(async () => {
    // Process images to get their dimensions
    processedImages.value = await Promise.all(
      props.property.images.map(async (url) => {
        const dimensions = await loadImageDimensions(url);
        return {
          url,
          ...dimensions
        };
      })
    );
  });
  
  const closeModal = () => {
    emit('close');
  };
  </script>
  
  <style scoped>
 
  </style>
  