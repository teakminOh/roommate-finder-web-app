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
import { useFavorites, type Property } from '~/composables/useFavorites';

const props = defineProps<{
  modelValue: boolean;
  property: Property;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const { addFavorite, removeFavorite } = useFavorites();
const showAuthModal = useAuthModal()
const user = useCurrentUser()

const toggleFavorite = async () => {
  if (props.modelValue) {
    await removeFavorite(props.property);
  } else {
    await addFavorite(props.property)
    if (!user.value) {
      showAuthModal.value = true;
    }
  }
  emit('update:modelValue', !props.modelValue);
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
  /* text-stroke: 2px black; */
  font-size: 2rem;
}
.material-symbols-outlined.text-red-500 {
  color: red;
  -webkit-text-stroke: 2px black;
  /* text-stroke: 2px black; */
}
.material-symbols-outlined:hover {
  color: rgba(255, 0, 0, 0.5);
  -webkit-text-stroke: 2px black;
  /* text-stroke: 2px black; */
}
</style>