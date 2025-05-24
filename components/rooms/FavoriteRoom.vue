<template>
  <button
    @click.stop="toggleFavorite"
    class="absolute top-2 right-2 z-10"
  >
    <span class="material-symbols-outlined" :class="{ 'text-red-500': modelValue }">
      {{ modelValue ? 'favorite' : 'favorite_border' }}
    </span>
  </button>
</template>

<script setup lang="ts">
import { useFavorites } from '~/composables/useFavorites';
import { useCurrentUser } from 'vuefire';
// Create a simple composable for auth modal if it doesn't exist
const useAuthModal = () => {
  const showAuthModal = ref(false);
  return { value: showAuthModal };
};

const props = defineProps<{
  modelValue: boolean;
  room: any; // Changed from Room type to any for flexibility
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const { addFavorite, removeFavorite } = useFavorites();
const showAuthModal = useAuthModal();
const user = useCurrentUser();

const toggleFavorite = async (event) => {
  // Stop event propagation to prevent parent card click
  event.stopPropagation();
  
  try {
    if (props.modelValue) {
      await removeFavorite(props.room);
    } else {
      // Handle the case where user is not logged in
      if (!user.value) {
        showAuthModal.value = true;
        return; // Don't proceed with adding favorite if not logged in
      }
      await addFavorite(props.room);
    }
    
    // Emit the updated value to the parent
    emit('update:modelValue', !props.modelValue);
  } catch (error) {
    console.error('Error toggling favorite:', error);
  }
};
</script>

<style scoped>
.material-symbols-outlined {
  font-variation-settings:
    'FILL' 1,
    'wght' 400,
    'GRAD' 0,
    'opsz' 48;
  color: white;
  -webkit-text-stroke: 2px black;
  font-size: 2rem;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.material-symbols-outlined.text-red-500 {
  color: red;
  -webkit-text-stroke: 2px black;
}

.material-symbols-outlined:hover {
  color: rgba(255, 0, 0, 0.5);
  -webkit-text-stroke: 2px black;
  transform: scale(1.1);
}
</style>