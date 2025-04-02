<template>
  <div class="min-h-screen flex">
    <!-- Sidebar -->
    <div class="w-64 bg-gray-100 p-4 shrink-0">
       <h2 class="text-xl font-bold">Profil</h2>
       <nav class="mt-4">
         <ul>
           <li><NuxtLink to="/dashboard" class="block py-2" active-class="font-bold text-indigo-600">Prehľad</NuxtLink></li>
           <li><NuxtLink to="/dashboard/messages" class="block py-2" active-class="font-bold text-indigo-600">Správy</NuxtLink></li>
           <li><button @click="logout" class="block py-2 text-red-500 hover:text-red-700">Odhlásiť sa</button></li>
         </ul>
       </nav>
    </div>

    <!-- Main Content -->
    <div class="flex-1 p-6 overflow-y-auto">
      <h1 class="text-2xl font-semibold mb-6">
        Vitaj, {{ displayName }}!
      </h1>

      <!-- Loading State -->
      <div v-if="isLoading" class="mt-4 text-center text-gray-500">
        <p>Loading dashboard data...</p>
      </div>

      <!-- Content Area -->
      <section v-else-if="user" class="space-y-8">

        <!-- Conditional Display Section -->
        <div>
          <!-- === User Info Display (if firstName exists) === -->
          <!-- Use the User Profile Component -->
          <UserProfileDisplay v-if="isUserMode" :profile="userProfile" />

          <!-- === Room Info Display (if firstName is missing) === -->
          <div v-else class="mt-2 space-y-4">
            <h2 class="text-xl font-semibold mb-3">Your Room Listing (Provider)</h2>
             <!-- Handle room loading/error state *before* rendering the component -->
            <div v-if="roomPending" class="text-gray-500">Loading room details...</div>
             <!-- Use the Room Listing Component -->
            <RoomListingDisplay v-else-if="roomData" :listing="roomData" />
            <!-- Error Message -->
            <p v-else class="text-gray-600 bg-white p-4 rounded shadow-sm border">
               You appear to be registered as a provider (no 'firstName' found), but the room listing associated with your account (ID: {{ user.uid }}) could not be found or loaded.
               <pre v-if="roomError" class="text-xs text-red-500 mt-1">Error: {{ roomError }}</pre>
             </p>
          </div>
        </div>

      </section>

      <!-- Error/Fallback sections -->
       <section v-else-if="!isLoading && !user" class="mt-4 text-center text-gray-500">
            <p>Please log in to view your dashboard.</p>
       </section>
       <section v-else-if="userProfileError" class="mt-4 text-center text-red-500">
             <p>Could not load your profile data. Please try again later.</p>
             <pre class="text-xs text-left mt-2">Profile Error: {{ userProfileError }}</pre>
       </section>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useFirestore, useCurrentUser, useDocument } from 'vuefire';
import { doc, getFirestore } from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';

import UserProfileDisplay from '~/components/dashboard/UserProfileDisplay.vue';
import RoomListingDisplay from '~/components/dashboard/RoomListingDisplay.vue';
// Removed formatDate import here, as it's used inside the components now


// --- Firebase Setup & Data Fetching (remains the same) ---
const db = useFirestore();
const auth = getAuth();
const user = useCurrentUser();
const userProfileRef = computed(() => user.value ? doc(db, 'users', user.value.uid) : null);
const { data: userProfile, pending: userProfilePending, error: userProfileError } = useDocument(userProfileRef);
const isUserMode = computed(() => userProfile.value !== undefined && !!userProfile.value?.firstName);
const roomDocRef = computed(() => (user.value && userProfile.value !== undefined && !isUserMode.value) ? doc(db, 'rooms', user.value.uid) : null);
const { data: roomData, pending: roomPending, error: roomError } = useDocument(roomDocRef);

// --- Loading State (remains the same) ---
const isLoading = computed(() => {
    if (user.value === undefined) return true;
    if (!user.value) return false;
    if (userProfilePending.value) return true;
    if (userProfile.value !== undefined && !isUserMode.value && roomPending.value) {
        return true;
    }
    return false;
});

// --- Display Name (remains the same) ---
const displayName = computed(() => {
     if (isLoading.value) return '...';
    if (isUserMode.value) {
        return userProfile.value?.firstName || 'User';
    } else {
        // Maybe use the listing email if available, otherwise user email
        return roomData.value?.email || user.value?.email || 'Provider';
    }
});

// --- Logout Method ---
const logout = async () => {
  try {
      await signOut(auth);
      await navigateTo('/');
  } catch (error) {
      console.error("Logout failed:", error);
      alert("Logout failed.");
  }
};

// Debugging watches (optional)
// watch(...)

</script>

<style scoped>
/* Basic styling for the main page layout if needed */
</style>