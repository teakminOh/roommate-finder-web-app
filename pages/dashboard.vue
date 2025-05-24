<template>
  <div class="min-h-screen -mt-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
    <!-- Animated background elements -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
      <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl"></div>
    </div>

    <!-- Main Content -->
    <div class="relative z-10 flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
      <!-- Loading State -->
      <div v-if="isLoading" class="mt-8 flex flex-col items-center justify-center space-y-6">
        <div class="relative">
          <div class="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
          <div class="absolute inset-0 w-16 h-16 border-4 border-transparent border-l-purple-400 rounded-full opacity-60"></div>
        </div>
        <div class="text-center space-y-2">
          <p class="text-lg font-medium text-slate-700">Načítavam údaje palubnej dosky...</p>
          <div class="flex space-x-1 justify-center">
            <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
          </div>
        </div>
      </div>

      <!-- Content Area -->
      <section v-else-if="user" class="space-y-8">
        <!-- Welcome Header -->
        <div class="text-center py-8">
          <h1 class="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-4">
            Váš Profil
          </h1>
          <p class="text-lg text-slate-600 max-w-2xl mx-auto">
            Spravujte svoj profil a inzeráty jednoducho a efektívne
          </p>
          <div class="mt-6 w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
        </div>

        <!-- Conditional Display Section -->
        <div class="max-w-6xl mx-auto">
          <!-- User Info Display -->
          <div v-if="isUserMode && userProfile">
            <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 hover:shadow-2xl transition-all duration-300">
              <div class="flex items-center space-x-4 mb-6">
                <div class="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"></div>
                <h2 class="text-2xl font-semibold text-slate-800">Váš profil</h2>
              </div>
              <UserProfileDisplay
                :profile="userProfile"
                @update-profile="handleUpdateProfile"
                @update-profile-image="handleImmediateImageUpdate"
              />
            </div>
          </div>

          <!-- Room Info Display -->
          <div v-else class="space-y-6">
            <!-- Loading Room Details -->
            <div v-if="roomPending" class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8">
              <div class="flex items-center justify-center space-x-4">
                <div class="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full"></div>
                <p class="text-lg text-slate-600">Načítavam detaily izby...</p>
              </div>
            </div>

            <!-- Room Listing Display -->
            <div v-else-if="roomData">
              <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 hover:shadow-2xl transition-all duration-300">
                <div class="flex items-center space-x-4 mb-6">
                  <div class="w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full"></div>
                  <h2 class="text-2xl font-semibold text-slate-800">Váš inzerát</h2>
                </div>
                <RoomListingDisplay
                  :listing="roomData"
                  @update-listing-details="handleUpdateRoomListingDetails"
                />
              </div>
            </div>

            <!-- Error State -->
            <div v-else class="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-8 shadow-lg">
              <div class="flex items-start space-x-4">
                <div class="flex-shrink-0">
                  <div class="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                  </div>
                </div>
                <div class="flex-1">
                  <h3 class="text-lg font-semibold text-slate-800 mb-2">Inzerát sa nepodarilo načítať</h3>
                  <p class="text-slate-600 leading-relaxed">
                    Zdá sa, že ste zaregistrovaný ako poskytovateľ (údaj 'firstName' nebol nájdený), ale inzerát izby priradený k vášmu účtu (ID: {{ user.uid }}) sa nepodarilo nájsť alebo načítať.
                  </p>
                  <pre v-if="roomError" class="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200 overflow-x-auto">
Chyba: {{ roomError }}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

     

      <!-- Profile Error State -->
      <section v-else-if="userProfileError" class="mt-16 text-center">
        <div class="max-w-md mx-auto bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl shadow-xl p-8">
          <div class="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h2 class="text-2xl font-semibold text-slate-800 mb-4">Chyba pri načítaní</h2>
          <p class="text-slate-600 mb-4">Nepodarilo sa načítať údaje vášho profilu. Skúste to prosím neskôr.</p>
          <pre class="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200 text-left overflow-x-auto">
Chyba profilu: {{ userProfileError }}
          </pre>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useFirestore, useCurrentUser, useDocument } from 'vuefire';
// Add Timestamp, and GeoPoint if you use it
import { doc, getFirestore, updateDoc, serverTimestamp, deleteField } from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';
import { useToast } from 'vue-toastification';
import UserProfileDisplay from '~/components/dashboard/UserProfileDisplay.vue';
import RoomListingDisplay from '~/components/dashboard/RoomListingDisplay.vue';

const db = useFirestore();
const auth = getAuth();
const user = useCurrentUser();
const toast = useToast();

const userProfileRef = computed(() => user.value ? doc(db, 'users', user.value.uid) : null);
const { data: userProfile, pending: userProfilePending, error: userProfileError } = useDocument(userProfileRef);

const isUserMode = computed(() => userProfile.value !== undefined && !!userProfile.value?.firstName);

const roomDocRef = computed(() => (user.value && userProfile.value !== undefined && !isUserMode.value) ? doc(db, 'rooms', user.value.uid) : null);
const { data: roomData, pending: roomPending, error: roomError } = useDocument(roomDocRef);

const isLoading = computed(() => {
    if (user.value === undefined) return true; // VueFire's initial state for useCurrentUser
    if (!user.value) return false; // Not logged in, not loading
    if (userProfilePending.value) return true; // Profile is loading

    // If profile has loaded and it's NOT user mode, then check room loading
    if (userProfile.value !== undefined && !isUserMode.value) {
        return roomPending.value;
    }
    return false; // All relevant data loaded
});

// In Dashboard.vue -> handleUpdateRoomListingDetails
async function handleUpdateRoomListingDetails({ data, onComplete }) {
  if (!user.value || !roomDocRef.value) {
    const errorMsg = "Chyba: Používateľ alebo referencia na inzerát nie je k dispozícii na aktualizáciu.";
    console.error(errorMsg);
    toast.error(errorMsg);
    if (onComplete) onComplete(false); // Signal failure
    return;
  }
  const dataToUpdate = { ...data }; // Create a shallow copy
  dataToUpdate.updatedAt = serverTimestamp();

  // Handle 'availableFrom': if it's an empty string from input, store as null.
  // Otherwise, it's already the 'YYYY-MM-DD' string we want to save.
  if (dataToUpdate.availableFrom === '') {
    dataToUpdate.availableFrom = null;
  }

  // Ensure 'images' is an array.
  dataToUpdate.images = Array.isArray(dataToUpdate.images) ? dataToUpdate.images : [];
  
  // Clean up imageStoragePaths if it's not being used for this storage structure
  delete dataToUpdate.imageStoragePaths; 

  // Remove 'id' field if it's part of the data, as it's the document ID
  delete dataToUpdate.id;

  // Optional: Convert coordinates to GeoPoint
  /*
  if (dataToUpdate.coordinates && dataToUpdate.coordinates.latitude != null && dataToUpdate.coordinates.longitude != null) {
    // import { GeoPoint } from 'firebase/firestore';
    dataToUpdate.coordinates = new GeoPoint(dataToUpdate.coordinates.latitude, dataToUpdate.coordinates.longitude);
  } else {
    dataToUpdate.coordinates = null; 
  }
  */

  try {
    console.log("Dashboard: Attempting to update room document:", roomDocRef.value.id, "with data:", dataToUpdate);
    await updateDoc(roomDocRef.value, dataToUpdate);
    console.log("Dashboard: Room document updated successfully.");
    toast.success("Detaily inzerátu úspešne uložené!");
    if (onComplete) onComplete(true);
  } catch (error) {
    console.error("Dashboard: Error updating room listing:", error);
    toast.error(`Nepodarilo sa uložiť zmeny inzerátu: ${error.message}`);
    if (onComplete) onComplete(false);
  }
}

async function handleImmediateImageUpdate(imageDataFromChild) {
  // imageDataFromChild is expected to be { url: 'new_url', path: 'new_full_storage_path' }
  // OR, if you implement removal in the child that emits an "empty" state:
  // { url: null, path: null } (or similar to indicate removal)

  if (!user.value || !userProfileRef.value) {
    console.error("User or profileRef not available for image update.");
    useToast().error("Chyba: Používateľ nie je prihlásený.");
    return;
  }

  console.log("Dashboard: Received immediate image update request with data:", imageDataFromChild);

  try {
    const dataForFirestore = {
      updatedAt: serverTimestamp()
    };

    // Correctly interpret the 'images' array from the emitted data
    if (imageDataFromChild.images && Array.isArray(imageDataFromChild.images) && imageDataFromChild.images.length > 0 && imageDataFromChild.images[0]) {
      dataForFirestore.images = imageDataFromChild.images; // This will be ['new_url']
    } else {
      dataForFirestore.images = []; // Image is being removed or was never there
    }

    // Handle the storage path
    if (imageDataFromChild.avatarStoragePath) {
      dataForFirestore.avatarStoragePath = imageDataFromChild.avatarStoragePath;
    } else {
      dataForFirestore.avatarStoragePath = null; // Or deleteField()
    }

    console.log("Dashboard: Updating Firestore user document with (CORRECTED LOGIC):", dataForFirestore);
    await updateDoc(userProfileRef.value, dataForFirestore);

    // Optimistically update local VueFire data
    if (userProfile.value) {
      userProfile.value.images = dataForFirestore.images;
      userProfile.value.avatarStoragePath = dataForFirestore.avatarStoragePath;
    }
  } catch (error) {
    console.error("Dashboard: Error updating profile image in Firestore:", error);
    toast.error("Nepodarilo sa uložiť zmenu profilového obrázka.");
  }
}

async function handleUpdateProfile(updatedData) {
  if (!user.value || !userProfileRef.value) {
    console.error("User or profileRef not available for update.");
    alert("Chyba: Používateľ alebo referencia na profil nie je k dispozícii na aktualizáciu.");
    return;
  }

  // Prepare data for Firestore: remove uid if present, add updatedAt timestamp
  const { uid, id, email, createdAt, ...dataToUpdate } = updatedData; // email and createdAt usually shouldn't be updated by user directly
  
  dataToUpdate.updatedAt = serverTimestamp(); // Add/update the updatedAt timestamp

  try {
    await updateDoc(userProfileRef.value, dataToUpdate);
    // Data will automatically re-fetch due to vuefire's reactivity on userProfile.
  } catch (error) {
    console.error("Error updating profile:", error);
  }
}

// Watch for user changes to potentially reset states or log
watch(user, (currentUser, previousUser) => {
  if (currentUser && !previousUser) {
    console.log("User logged in:", currentUser.uid);
  } else if (!currentUser && previousUser) {
    console.log("User logged out");
  }
});
</script>

<style scoped>
/* All custom styles related to scrollbar and animations have been removed. */
/* The hover:shadow-2xl and its transition are kept as per previous step, */
/* as they are more about interactive feedback than pure animation. */
/* If you want those removed as well, let me know. */
</style>