<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import ListingsPage from '~/components/ListingsPage.vue'
// Potentially import Searchbar if it's not globally registered or part of another component
// import Searchbar from '~/components/Searchbar.vue' // Assuming Searchbar is used somewhere

// Animation state
const isLoaded = ref(false)

onMounted(() => {
  // Trigger animations after component mounts
  // Consider using nextTick if you want to ensure the DOM is fully patched
  // before starting, though setTimeout is common for this kind of delay.
  // For critical content readiness, you might coordinate with ListingsPage.
  setTimeout(() => {
    isLoaded.value = true
  }, 100) // This delay is for perceived smoothness, not actual load time.
})
</script>

<template>
  <div class="-mt-4 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
    <!-- Background Elements - Responsive positioning and sizing -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-20 sm:-top-40 -right-20 sm:-right-40 w-40 h-40 sm:w-80 sm:h-80 bg-blue-400/10 rounded-full blur-xl sm:blur-3xl"></div>
      <div class="absolute top-1/2 -left-16 sm:-left-32 w-32 h-32 sm:w-64 sm:h-64 bg-indigo-400/10 rounded-full blur-xl sm:blur-3xl"></div>
      <div class="absolute bottom-10 sm:bottom-20 right-1/4 w-24 h-24 sm:w-48 sm:h-48 bg-purple-400/10 rounded-full blur-lg sm:blur-2xl"></div>
    </div>

    <!-- Main Content Container -->
    <div class="relative z-1">
      <!-- Header Section with Search - Responsive padding and layout -->
      <header class="pt-12 sm:pt-16 lg:pt-20 pb-6 sm:pb-8 relative">
        <!-- Background image - OPTION: Use <picture> for WebP -->
        
          <div class="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
             style="background-image: url('/images/bg2.webp');"></div>
       
        
        <!-- Optional overlay for better text readability -->
        <div class="absolute inset-0 bg-black bg-opacity-30 z-1"></div>
        
        <!-- Content container - responsive padding -->
        <div class="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <!-- Page Title & Description - Responsive typography -->
          <Transition
            enter-active-class="transition-all duration-700 ease-out"
            enter-from-class="transform translate-y-8 opacity-0"
            enter-to-class="transform translate-y-0 opacity-100"
          >
            <div v-if="isLoaded" class="text-center mb-4 sm:mb-6">
              <h1 class="text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-2 px-2 sm:px-0 leading-tight">
                Nájdi si perfektný domov.
              </h1>
            </div>
          </Transition>
          
          <!-- Enhanced Search Section - Responsive width and padding -->
          <Transition
            enter-active-class="transition-all duration-700 ease-out delay-200"
            enter-from-class="transform translate-y-8 opacity-0"
            enter-to-class="transform translate-y-0 opacity-100"
          >
            <div v-if="isLoaded" class="max-w-xs sm:max-w-2xl lg:max-w-4xl mx-auto px-2 sm:px-0">
              <div class="transition-all duration-300">
                <!-- Assuming Searchbar is globally registered or imported elsewhere -->
                <Searchbar />
              </div>
            </div>
          </Transition>
        </div>
      </header>
        
      <!-- Listings Section - Responsive layout -->
      <main class="pb-12 sm:pb-16 lg:pb-20">
        <!-- Section Header - Responsive padding and layout -->
        <div class="nmc bg-gradient-to-r from-blue-600/5 to-indigo-600/5 border-b border-gray-100/50 px-4 lg:px-8 py-4">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
            <div class="sm:ml-4 lg:ml-20">
              <h2 class="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                Dostupné ponuky
              </h2>
              <p class="text-sm sm:text-base text-gray-600">
                Preskúmaj najnovšie možnosti ubytovania
              </p>
            </div>
            <div class="flex items-center space-x-2 sm:space-x-4 sm:mr-4 lg:mr-20 w-full sm:w-auto">
              <div class="bg-blue-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full flex-shrink-0">
                <span class="text-xs sm:text-sm font-medium text-blue-700">Nové ponuky</span>
              </div>
              <div class="bg-green-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full flex-shrink-0">
                <span class="text-xs sm:text-sm font-medium text-green-700">Overené</span>
              </div>
            </div>
          </div>
        </div>
        <!-- ListingsPage will be the main area for performance focus related to content -->
        <ListingsPage />
      </main>
    </div>
  </div>
</template>

<style scoped>
/* Custom shadow utilities */
.shadow-3xl {
  box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
}

/* Smooth scroll behavior - does not affect load time, but user experience */
/* html {
  scroll-behavior: smooth; /* This should be in a global stylesheet, not scoped */
/* } */

/* Custom gradient mesh background */
/* @keyframes float { ... } .float-animation { ... } */
/* These animations are fine, ensure they don't apply to too many elements or become too complex */

/* Additional responsive utilities */
/* @media (max-width: 640px) { ... } */
/* @media (max-width: 480px) { ... } */
/* These media queries are standard and good for responsiveness. */
</style>