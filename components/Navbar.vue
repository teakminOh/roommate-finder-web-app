<template>
  <nav class="navbar fixed top-0 left-0 w-full bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100 text-blue-900 z-20">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo Section -->
        <div class="flex items-center space-x-3 transition-all duration-300 hover:scale-105">
          <div class="relative">
            <img 
              src="../public/images/Toby.png" 
              alt="Buddies Logo" 
              class="w-10 h-10" 
            />
          </div>
          <NuxtLink to="/" class="text-2xl font-bold text-blue-900 tracking-tight hover:text-blue-700 transition-colors duration-200">
            <span class="text-blue-600">b</span>uddies
          </NuxtLink>
        </div>
        
        <!-- Desktop Navigation -->
        <div class="hidden md:flex items-center space-x-1">
          <NuxtLink 
            to="/searchroom" 
            class="group flex items-center px-4 py-2 rounded-xl text-gray-700 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 font-medium relative overflow-hidden"
          >
            <svg class="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
            <span>Izby</span>
          </NuxtLink>
          
          <NuxtLink 
            to="/searchuser" 
            class="group flex items-center px-4 py-2 rounded-xl text-gray-700 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 font-medium relative overflow-hidden"
          >
            <svg class="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            <span>Spolubývajúci</span>
          </NuxtLink>
        </div>
        
        <!-- Right Section (Auth/User) -->
        <div class="flex items-center space-x-4">
          <!-- Login Button or User Dropdown -->
          <div v-if="!isAuthenticated">
            <button
              @click="openLogin"
              class="group relative bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2.5 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 overflow-hidden"
            >
              <span class="relative z-10">Prihlásiť sa</span>
              <div class="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </button>
          </div>
          
          <UserDropdown v-else :userInitials="userInitials" @signOut="signOut" />
          
          <!-- Mobile Menu Button -->
          <button 
            @click="toggleMenu" 
            class="md:hidden p-2 rounded-xl hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
            :class="{ 'bg-blue-50': menuOpen }"
          >
            <svg
              class="w-6 h-6 transform transition-transform duration-200"
              :class="{ 'rotate-90': menuOpen }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                v-if="!menuOpen"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
              <path
                v-else
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
    
    <!-- Mobile Menu -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="transform -translate-y-full opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform -translate-y-full opacity-0"
    >
      <div v-if="menuOpen" class="md:hidden bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-lg">
        <div class="px-4 py-6 space-y-3">
          <NuxtLink 
            to="/searchroom" 
            @click="toggleMenu"
            class="group flex items-center w-full px-4 py-3 rounded-xl text-gray-700 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 font-medium"
          >
            <svg class="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
            <span>Izby</span>
            <svg class="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </NuxtLink>
          
          <NuxtLink 
            to="/searchuser" 
            @click="toggleMenu"
            class="group flex items-center w-full px-4 py-3 rounded-xl text-gray-700 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 font-medium"
          >
            <svg class="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            <span>Spolubývajúci</span>
            <svg class="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </NuxtLink>
          
          <!-- Mobile Login Button -->
          <div v-if="!isAuthenticated" class="pt-4 border-t border-gray-100">
            <button
              @click="openLogin(); toggleMenu()"
              class="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Prihlásiť sa
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </nav>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useCurrentUser, useFirebaseAuth } from 'vuefire';
import { signOut as firebaseSignOut } from 'firebase/auth';
import UserDropdown from './UserDropdown.vue';
import { useAuthModal } from '../composables/useAuthModal';

const auth = useFirebaseAuth();
const user = useCurrentUser();

const isAuthenticated = ref(false);
const userInitials = ref('');

// Watch for auth state changes
watch(user, (newUser) => {
  isAuthenticated.value = !!newUser;
  if (newUser?.displayName) {
    // Get initials from display name
    userInitials.value = newUser.displayName
      .split(' ')
      .map((name: string) => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  } else if (newUser?.email) {
    // If no display name, use first letter of email
    userInitials.value = newUser.email[0].toUpperCase();
  } else {
    userInitials.value = 'U'; // Fallback
  }
}, { immediate: true });

const showAuthModal = useAuthModal()

const openLogin = () => {
  showAuthModal.value = true
}

// Reactive variable for menu state
const menuOpen = ref(false);

// Method to toggle the menu
const toggleMenu = () => {
  menuOpen.value = !menuOpen.value;
};

const showDropdown = ref(false);

const signOut = async () => {
  try {
    if (auth) {
      await firebaseSignOut(auth);
      navigateTo('/');
    }
  } catch (error) {
    console.error('Error signing out:', error);
  }
};
</script>