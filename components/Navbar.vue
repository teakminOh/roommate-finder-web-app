<template>
  <nav class="text-blue-900">
    <div class="container mx-auto flex justify-between items-center py-4 px-6">
      <!-- Logo -->
      <a href="#" class="text-2xl font-bold text-blue-900">RealEstateApp</a>
      <!-- Desktop Links -->
      <ul class="hidden md:flex space-x-6">
        <li><a href="/buy" class="hover:text-black transition">Kúp</a></li>
        <li><a href="/sell" class="hover:text-black transition">Predaj</a></li>
        <li><a href="/contact" class="hover:text-black transition">Kontakt</a></li>
        <li>
          <a
            href="/login"
            class="hover:text-black hover:bg-blue-200 transition rounded bg-blue-100 p-2"
          >
            Prihlásiť sa
          </a>
        </li>
      </ul>

      <!-- Mobile Menu Button -->
      <button @click="toggleMenu" class="md:hidden focus:outline-none">
        <svg
          class="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16m-7 6h7"
          ></path>
        </svg>
      </button>
    </div>

    <!-- Mobile Menu with Slide Down/Up Effect -->
    <transition name="slide">
      <div
        v-if="menuOpen"
        class="md:hidden bg-blue-200 py-2"
      >
        <a href="/buy" class="block py-2 px-4 hover:bg-blue-300">Kúp</a>
        <a href="/sell" class="block py-2 px-4 hover:bg-blue-300">Predaj</a>
        <a href="/contact" class="block py-2 px-4 hover:bg-blue-300">Kontakt</a>
        <a href="/login" class="block py-2 px-4 hover:bg-blue-300">Prihlásiť sa</a>
      </div>
    </transition>
  </nav>
</template>

<script setup>
import { ref } from 'vue';

// Reactive variable for menu state
const menuOpen = ref(false);

// Method to toggle the menu
const toggleMenu = () => {
  menuOpen.value = !menuOpen.value;
};
</script>

<style scoped>
/* Slide Down and Slide Up Animations */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.5s ease-out;
}

.slide-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}

.slide-enter-to {
  transform: translateY(0);
  opacity: 1;
}

.slide-leave-from {
  transform: translateY(0);
  opacity: 1;
}

.slide-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
