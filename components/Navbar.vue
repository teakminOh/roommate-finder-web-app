<template>
  <nav class="navbar fixed top-0 left-0 w-full bg-white shadow-md text-blue-900 z-20">
    <div class="container mx-auto grid grid-cols-3 items-center py-4 px-6">
      <!-- Logo (left section) -->
      <div class="flex items-center space-x-2 ml-32">
        <img src="../public/images/Toby.png" alt="" class="w-10 h-10" />
        <NuxtLink to="/" class="text-2xl font-bold text-blue-900">buddies</NuxtLink>
      </div>
      
      <!-- Middle navigation (centered) -->
      <ul class="flex justify-center">
        
      </ul>
      
      <!-- Right menu (right-aligned) -->
      <ul class="hidden md:flex justify-end items-center gap-10 mr-32">
        <!-- <li><NuxtLink to="/contact" class="hover:text-black transition">Kontakt</NuxtLink></li> -->
        <li class="hidden md:flex gap-6">
          <NuxtLink to="/searchroom" class=" hover:text-black p-2 transition flex  justify-center items-center">
            <img src="../public/images/home1.png" alt="" class="w-6 h-6 mr-2">Izby
          </NuxtLink>
          <NuxtLink to="/searchuser" class="  p-2 transition flex  justify-center items-center">
            <img src="../public/images/user.png" alt="" class="w-6 h-6 mr-2">Spolubývajúci
          </NuxtLink>
        </li>
        <li>
          <a 
            v-if="!isAuthenticated" 
            @click.prevent="openLogin" 
            class="hover:text-black hover:bg-blue-200 transition rounded bg-blue-100 p-2 cursor-pointer"
          >
            Prihlásiť sa
          </a>
          <UserDropdown v-else :userInitials="userInitials" @signOut="signOut" />
        </li>
      </ul>
      
      <!-- Mobile Menu Button -->
      <button @click="toggleMenu" class="md:hidden justify-self-end focus:outline-none">
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
  </nav>
</template>

<script setup lang="ts">
import { ref } from 'vue';
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
