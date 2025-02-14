<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50">
    <img :src="images[currentIndex]" class="max-h-[90vh] max-w-[90vw] object-contain" />
    <button @click="close" class="absolute top-4 right-4 text-white text-xl">
      ✖
    </button>
    <button 
      v-if="images.length > 1" 
      @click="prevImage" 
      class="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-xl"
    >
      ◀
    </button>
    <button 
      v-if="images.length > 1" 
      @click="nextImage" 
      class="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-xl"
    >
      ▶
    </button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  isOpen: boolean;
  images: string[];
  currentIndex: number;
}>();

const emit = defineEmits(['update:isOpen', 'update:currentIndex']);

const close = () => {
  emit('update:isOpen', false);
};

const prevImage = () => {
  const newIndex = (props.currentIndex - 1 + props.images.length) % props.images.length;
  emit('update:currentIndex', newIndex);
};

const nextImage = () => {
  const newIndex = (props.currentIndex + 1) % props.images.length;
  emit('update:currentIndex', newIndex);
};
</script> 