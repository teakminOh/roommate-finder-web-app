<!-- UserDropdown.vue -->
<template>
  <div class="relative" ref="dropdownRef">
    <!-- User Avatar Button: Conditionally render img or initials -->
    <div
      @click="toggleDropdown"
      class="w-10 h-10 rounded-full text-white flex items-center justify-center text-sm font-semibold cursor-pointer hover:opacity-90 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 ring-2 ring-white ring-opacity-20 overflow-hidden"
      :class="{ 'bg-gradient-to-br from-blue-500 to-blue-700': !userProfileData.profilePictureUrl.value }"
    >
      <img
        v-if="userProfileData.profilePictureUrl.value"
        :src="userProfileData.profilePictureUrl.value"
        alt="Profil"
        class="w-full h-full object-cover"
        @error="onImageError" 
      />
      <span v-else>{{ userProfileData.userInitials.value }}</span>
    </div>

    <!-- Dropdown Menu -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="showDropdown"
        class="absolute right-0 top-full mt-3 py-2 w-60 bg-white rounded-xl shadow-2xl z-50 border border-gray-100" 
      > 
        <!-- User Info Section -->
        <div class="px-4 py-3 border-b border-gray-100">
          <div class="flex items-center space-x-3">
            <!-- Mini Avatar in Dropdown -->
            <div class="w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-semibold overflow-hidden"
                 :class="{ 'bg-gradient-to-br from-blue-500 to-blue-700': !userProfileData.profilePictureUrl.value }"
            >
              <img
                v-if="userProfileData.profilePictureUrl.value && !imageLoadError"
                :src="userProfileData.profilePictureUrl.value"
                alt="Profil"
                class="w-full h-full object-cover"
              />
              <span v-else>{{ userProfileData.userInitials.value }}</span>
            </div>
            <div class="flex flex-col">
                <div class="text-sm font-medium text-gray-800">
                    {{ userProfileData.userDisplayName.value || 'Môj účet' }}
                </div>
                <div class="text-xs text-gray-500" v-if="!userContext.isProcessingContext.value && userContext.user.value">
                    ({{ userContext.hasListedRoom.value ? 'Prenajímateľ' : 'Nájomník' }})
                </div>
            </div>
          </div>
        </div>

        <!-- Navigation Links -->
        <div class="py-1">
          <NuxtLink
            to="/chats"
            class="group flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150"
          >
            <svg class="w-4 h-4 mr-3 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
            Správy
          </NuxtLink>

          <NuxtLink
            :to="userContext.recommendationsPath.value"
            class="group flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150"
          >
             <svg class="w-4 h-4 mr-3 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
            </svg>
            <span v-if="userContext.isProcessingContext.value">Odporúčania...</span>
            <span v-else-if="userContext.hasListedRoom.value">Zhody pre izbu</span>
            <span v-else>Odporúčania</span>
          </NuxtLink>

          <NuxtLink
            to="/dashboard"
            class="group flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150"
          >
            <svg class="w-4 h-4 mr-3 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            Profil
          </NuxtLink>

          <NuxtLink
            to="/favorites"
            class="group flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150"
          >
           <svg class="w-4 h-4 mr-3 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
            Uložené
          </NuxtLink>
        </div>

        <div class="border-t border-gray-100 my-1"></div>

        <a
          @click.prevent="handleSignOut"
          class="group flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-150 cursor-pointer"
        >
          <svg class="w-4 h-4 mr-3 text-red-400 group-hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          Odhlásiť sa
        </a>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { useUserContext } from '~/composables/useUserContext'
import { useUserProfileData } from '~/composables/useUserProfileData' // Import the new composable for profile data

const { signOut: firebaseSignOut } = useAuth()
const userContext = useUserContext();
const userProfileData = useUserProfileData(); // Use the profile data composable

const showDropdown = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const imageLoadError = ref(false); // State to track image loading errors

// Removed props definition for userInitials, as it's now handled by useUserProfileData

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    showDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const toggleDropdown = (event: MouseEvent) => {
  event.stopPropagation()
  showDropdown.value = !showDropdown.value
  imageLoadError.value = false; // Reset error on toggle
}

const onImageError = () => {
  console.warn("UserDropdown: Profile image failed to load.");
  imageLoadError.value = true; // Set error flag to true to fall back to initials
}

const handleSignOut = async () => {
  await firebaseSignOut();
  showDropdown.value = false;
}
</script>