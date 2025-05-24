<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ListingsPage from '~/components/ListingsPage.vue'

// Animation state
const isLoaded = ref(false)

onMounted(() => {
  // Trigger animations after component mounts
  setTimeout(() => {
    isLoaded.value = true
  }, 100)
})
</script>

<template>
  <div class="-mt-4 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
    <!-- Background Elements -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl"></div>
      <div class="absolute top-1/2 -left-32 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl"></div>
      <div class="absolute bottom-20 right-1/4 w-48 h-48 bg-purple-400/10 rounded-full blur-2xl"></div>
    </div>
    
    <!-- Main Content Container -->
    <div class="relative z-10">
      <!-- Header Section with Search -->
      <!-- Header Section with Search -->
<header class="pt-20 pb-8 relative">
  <!-- Background image -->
  <div class="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
       style="background-image: url('/images/bg2.jpg');"></div>
  
  <!-- Optional overlay for better text readability -->
  <div class="absolute inset-0 bg-black bg-opacity-30 z-1"></div>
  
  <!-- Content container - positioned above background -->
  <div class="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
    <!-- Page Title & Description -->
    <Transition
      enter-active-class="transition-all duration-700 ease-out"
      enter-from-class="transform translate-y-8 opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
    >
      <div v-if="isLoaded" class="text-center mb-4">
        <h1 class="text-white text-6xl font-black mb-2">
          Nájdi si perfektný domov.
        </h1>
      
      </div>
    </Transition>
    
    <!-- Enhanced Search Section -->
    <Transition
      enter-active-class="transition-all duration-700 ease-out delay-200"
      enter-from-class="transform translate-y-8 opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
    >
      <div v-if="isLoaded" class="max-w-4xl mx-auto">
        <div class="transition-all duration-300">
          <Searchbar />
        </div>
      </div>
    </Transition>
  </div>
</header>
      
      <!-- Listings Section -->
      <main class="pb-20">
       
          
          
           
              <!-- Section Header -->
              <div class="bg-gradient-to-r from-blue-600/5 to-indigo-600/5 border-b border-gray-100/50 px-8 py-6">
                <div class="flex items-center justify-between">
                  <div class="ml-20">
                    <h2 class="text-2xl font-bold text-gray-900 mb-1">
                      Dostupné ponuky
                    </h2>
                    <p class="text-gray-600">
                      Preskúmaj najnovšie možnosti ubytovania
                    </p>
                  </div>
                  
                  <!-- Quick Stats or Filters -->
                  <div class="hidden sm:flex items-center space-x-4 mr-20">
                    <div class="bg-blue-50 px-4 py-2 rounded-full">
                      <span class="text-sm font-medium text-blue-700">Nové ponuky</span>
                    </div>
                    <div class="bg-green-50 px-4 py-2 rounded-full">
                      <span class="text-sm font-medium text-green-700">Overené</span>
                    </div>
                  </div>
                </div>
              </div>
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

/* Smooth scroll behavior */
html {
  scroll-behavior: smooth;
}

/* Custom gradient mesh background */
@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

.float-animation {
  animation: float 6s ease-in-out infinite;
}
</style>