<template>
  <div class="relative" ref="dropdownRef">
    <div 
      @click="toggleDropdown"
      class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium cursor-pointer"
    >
      {{ userInitials }}
    </div>
    
    <!-- Dropdown Menu -->
    <div v-if="showDropdown" 
      class="absolute right-0 top-full mt-2 py-2 w-48 bg-white rounded-lg shadow-xl z-50"
    >
      <a 
        @click="handleSignOut"
        class="block px-4 py-2 text-gray-800 hover:bg-gray-100 cursor-pointer"
      >
        Odhlásiť sa
      </a>
        <a href="/favorites" class="block px-4 py-2 text-gray-800 hover:bg-gray-100 cursor-pointer">Saved</a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { signOut } from 'firebase/auth';
import { ref, onMounted, onUnmounted } from 'vue';
import { useFirebaseAuth } from 'vuefire';

const auth = useFirebaseAuth()!;

const props = defineProps<{
  userInitials: string;
}>();

const emit = defineEmits(['signOut']);
const showDropdown = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    showDropdown.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

const toggleDropdown = (event: MouseEvent) => {
  event.stopPropagation();
  showDropdown.value = !showDropdown.value;
};

const handleSignOut = () => {
  signOut(auth);
  showDropdown.value = false;
};
</script>

<style scoped>
.group:hover > div:last-child {
  display: block;
}
</style> 