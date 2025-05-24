<template>
    <div class="fixed inset-0 bg-black/60 flex justify-center items-center z-[1100]" @click="$emit('close')">
      <div class="bg-white flex-col p-8 pt-0 w-2/3 h-screen overflow-y-auto relative" @click.stop>
  
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
            <span>Späť</span>
        </button>
        <!-- Gallery Grid -->
        <div id="fullGalleryGrid" class="grid grid-cols-2 gap-2 pt-4">
          <a
            v-for="(image, index) in images"
            :key="index"
            :href="image.url"
            :data-pswp-width="image.width"
            :data-pswp-height="image.height"
            target="_blank"
            @click.prevent="openGallery(index)"
            class="relative flex justify-center items-center overflow-hidden group h-[40vh]"
            :class="{
              'col-span-2 h-[60vh]': index % 3 === 0
            }"
          >
            <!-- Image Container -->
            <div class="relative w-full h-full">
              <img 
                :src="image.url" 
                :alt="`Image ${index + 1}`" 
                loading="lazy"
                class="w-full h-full object-cover cursor-pointer transition-all duration-200"
              />
    
              <!-- Dark Overlay on Hover -->
              <div class="absolute top-0 left-0 w-full h-full bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-200"></div>
            </div>
          </a>
        </div>
  
        <!-- PhotoSwipe Root Element -->
        <div class="pswp hidden" tabindex="-1" role="dialog" aria-hidden="true" ref="pswpElement"></div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import PhotoSwipeLightbox from 'photoswipe/lightbox';
  import 'photoswipe/style.css';
  
  const props = defineProps<{
    images: Array<{ url: string; width: number; height: number }>;
  }>();
  
  defineEmits(['close']);
  
  let lightbox: any = null;
  
  onMounted(() => {
    lightbox = new PhotoSwipeLightbox({
      gallery: '#fullGalleryGrid',
      children: 'a',
      pswpModule: () => import('photoswipe'),
      preload: [1, 2],
      showHideAnimationType: 'zoom',
    });
    lightbox.init();
  });
  
  const openGallery = (index: number) => {
    lightbox.loadAndOpen(index);
  };
  </script>
  
  