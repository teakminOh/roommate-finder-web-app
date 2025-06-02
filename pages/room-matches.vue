<script setup lang="ts">
import { ref, computed, watch, shallowRef } from 'vue';
import { useCurrentUser, useFirestore, useDocument, useCollection } from 'vuefire';
import {
    collection, query, where, orderBy, limit, doc, getDocs,
    documentId, type FirestoreError, type Timestamp,
    type DocumentData, // Import DocumentData
    type QueryDocumentSnapshot, type SnapshotOptions // For explicit converter types
} from 'firebase/firestore';

// --- Type Imports ---
import type { Room } from '~/types/room';
import type { Roommate } from '~/types/user';
import type { MatchUserRoomData } from '~/types/match';

interface DisplayableRoomApplicant {
  profile: Roommate;
  matchData: MatchUserRoomData;
  matchDocId: string;
}

import RoommateItem from '~/components/users/RoommateItem.vue';
import MatchInfoDisplay from '~/components/matches/MatchInfoDisplay.vue';

const MAX_MATCHES_TO_LOAD = 50;

const isLoading = ref(true);
const error = ref<string | null>(null);
const userRoom = ref<Room | null>(null);
const displayableRoomApplicants = shallowRef<DisplayableRoomApplicant[]>([]);

const user = useCurrentUser();
const db = useFirestore();

const userRoomDocRef = computed(() => {
  if (user.value?.uid) {
    return doc(db, 'rooms', user.value.uid);
  }
  return null;
});

const {
    data: fetchedUserRoomData,
    pending: userRoomPending,
    error: userRoomError,
} = useDocument<Room>(userRoomDocRef, { // Provide Room type here
  converter: {
    fromFirestore: (snapshot: QueryDocumentSnapshot<DocumentData>, options?: SnapshotOptions): Room | null => {
      const data = snapshot.data(options);
      if (!data) return null;
      return { ...data, id: snapshot.id } as Room;
    },
    toFirestore: (room: Room): DocumentData => { // modelObject parameter should be strongly typed
      const { id, ...dataToWrite } = room;
      return dataToWrite;
    }
  }
});

watch(fetchedUserRoomData, (newRoom) => {
  userRoom.value = newRoom || null;
  if (!newRoom) {
    displayableRoomApplicants.value = [];
  }
  console.log("MyRoomMatches: User room data updated/fetched:", userRoom.value ? userRoom.value.id : 'No room');
}, { immediate: true });

const roomApplicantsQuery = computed(() => {
  if (!user.value?.uid || !userRoom.value) {
    return null;
  }
  return query(
    collection(db, 'matches'),
    where('type', '==', 'user-room'),
    where('roomId', '==', user.value.uid),
    orderBy('score', 'desc'),
    limit(MAX_MATCHES_TO_LOAD)
  );
});

const {
    data: rawRoomApplicants,
    pending: applicantsPending,
    error: applicantsError,
} = useCollection<MatchUserRoomData>(roomApplicantsQuery, { // Provide MatchUserRoomData type here
  converter: {
    fromFirestore: (snapshot: QueryDocumentSnapshot<DocumentData>, options?: SnapshotOptions): MatchUserRoomData => {
      const data = snapshot.data(options)!;
      return { ...data, id: snapshot.id } as MatchUserRoomData;
    },
    toFirestore: (matchData: MatchUserRoomData): DocumentData => { // modelObject parameter should be strongly typed
      const { id, ...dataToWrite } = matchData;
      return dataToWrite;
    }
  }
});

// --- Helper: Fetch full profiles (non-reactive) ---
async function fetchFullProfiles<T extends { id: string }>(
    collectionName: 'users', // Specifically for roommate profiles
    ids: string[]
): Promise<{ [id: string]: T }> {
    if (!ids || ids.length === 0) return {};
    const uniqueIds = [...new Set(ids)].filter(id => id); // Filter out any null/undefined
    if (uniqueIds.length === 0) return {};

    const profiles: { [id: string]: T } = {};
    const CHUNK_SIZE = 30; // Firestore 'in' query limit

    for (let i = 0; i < uniqueIds.length; i += CHUNK_SIZE) {
        const chunk = uniqueIds.slice(i, i + CHUNK_SIZE);
        if (chunk.length > 0) {
            const q = query(collection(db, collectionName), where(documentId(), 'in', chunk));
            try {
                const snapshot = await getDocs(q);
                snapshot.forEach(docSnap => {
                    profiles[docSnap.id] = { ...docSnap.data(), id: docSnap.id } as T;
                });
            } catch (e) {
                console.error(`Error fetching profiles from ${collectionName} for chunk:`, chunk, e);
            }
        }
    }
    return profiles;
}

// --- Watcher to Process Applicants when Raw Data or User Room Changes ---
watch(
  [rawRoomApplicants, userRoom, user], 
  async ([newRawApplicants, currentRoom, currentUser]) => { // Removed oldUser as it wasn't used
    if (!currentUser) {
      displayableRoomApplicants.value = [];
      userRoom.value = null; 
      console.log("MyRoomMatches: User logged out, clearing data.");
      return;
    }

    if (!currentRoom) {
      displayableRoomApplicants.value = [];
      console.log("MyRoomMatches: No user room document found or loaded yet.");
      return;
    }

    if (!newRawApplicants || newRawApplicants.length === 0) {
      displayableRoomApplicants.value = [];
      console.log("MyRoomMatches: No raw applicants data for the room.");
      return;
    }

    console.log("MyRoomMatches: Raw applicants changed, processing...");
    const processingProfiles = ref(true);
    error.value = null; 

    try {
      const applicantUserIds = new Set<string>();
      newRawApplicants.forEach(match => { 
        if (match.userId) applicantUserIds.add(match.userId);
      });

      if (applicantUserIds.size === 0) {
        displayableRoomApplicants.value = [];
        console.log("MyRoomMatches: No applicant IDs to fetch.");
        processingProfiles.value = false;
        return;
      }

      const roommateProfilesMap = await fetchFullProfiles<Roommate>('users', Array.from(applicantUserIds));

      const finalApplicants: DisplayableRoomApplicant[] = [];
      newRawApplicants.forEach(matchData => {
        const profile = roommateProfilesMap[matchData.userId];
        if (profile) {
          finalApplicants.push({
            profile: profile,
            matchData: matchData, 
            matchDocId: matchData.id, 
          });
        } else if (matchData.userId) {
          console.warn(`MyRoomMatches: Roommate profile not found for user ID ${matchData.userId}`);
        }
      });

      displayableRoomApplicants.value = finalApplicants.sort((a, b) => b.matchData.score - a.matchData.score);
      console.log("MyRoomMatches: Displayable applicants updated.");

    } catch (err: any) {
      console.error("MyRoomMatches: Error processing applicants or fetching profiles:", err);
      error.value = `Failed to process applicants: ${err.message || 'Unknown error'}`;
    } finally {
      processingProfiles.value = false;
    }
  },
  { immediate: true, deep: true } 
);

// --- Watcher for Overall Loading State ---
watch(
  [userRoomPending, applicantsPending, user],
  ([roomPending, appPending, currentUser]) => {
    if (!currentUser) {
        isLoading.value = false; 
        return;
    }
    if (roomPending) {
        isLoading.value = true;
    } else if (userRoom.value && appPending) { 
        isLoading.value = true;
    }
    else {
        isLoading.value = false;
    }
  },
  { immediate: true }
);

// --- Watcher for Errors from VueFire ---
watch([userRoomError, applicantsError], ([rError, aError]) => {
  let combinedError = "";
  if (rError) {
    console.error("MyRoomMatches: Firestore user room listener error:", rError);
    combinedError += "Chyba pri načítaní vašej izby. ";
    userRoom.value = null; 
  }
  if (aError && userRoom.value) { 
    console.error("MyRoomMatches: Firestore room applicants listener error:", aError);
    combinedError += "Chyba pri načítaní uchádzačov o izbu.";
  }
  if (combinedError) error.value = combinedError.trim();
});

// --- Computed display name for the user's room ---
const roomDisplayName = computed(() => {
  if (!userRoom.value) return "Vaša izba";
  const type = userRoom.value.propertyType || "Izba";
  const loc = userRoom.value.location ? userRoom.value.location.split(',')[0].trim() : "";
  return loc ? `${type} v ${loc}` : type;
});
</script>

<template>
  <div class="bg-slate-50 min-h-screen -mt-4">
    <!-- Enhanced Header -->
    <div class="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white py-16 px-6 sm:px-10 shadow-2xl overflow-hidden">
      <div class="absolute inset-0 bg-black/10"></div>
      <div class="absolute top-0 left-0 w-full h-full">
        <div class="absolute top-10 left-10 w-20 h-20 bg-white/5 rounded-full"></div>
        <div class="absolute top-20 right-20 w-16 h-16 bg-white/10 rounded-full"></div>
        <div class="absolute bottom-10 left-1/4 w-12 h-12 bg-white/5 rounded-full"></div>
      </div>
      <div class="max-w-6xl mx-auto relative z-10">
        <div class="flex items-center">
          <div class="bg-white/20 backdrop-blur-sm rounded-full p-3 mr-4">
            <span class="material-symbols-outlined text-3xl">bookmark</span>
          </div>
          <div>
            <h1 class="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              <span v-if="userRoomPending && !userRoom && user">Načítavanie informácií o vašej izbe...</span>
              <span v-else-if="userRoom">{{ roomDisplayName }} - Zhody</span>
              <span v-else-if="!userRoomPending && !userRoom && user">Nemáte pridanú žiadnu izbu</span>
              <span v-else-if="!user">Zhody pre vašu izbu</span>
            </h1>
            <p class="text-blue-100 text-lg">
              <span v-if="userRoom">Potenciálni spolubývajúci pre vašu izbu</span>
              <span v-else>Spravujte svoju izbu a nájdite spolubývajúcich</span>
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
      <!-- Enhanced Loading State -->
      <div v-if="isLoading && !error" class="flex flex-col items-center justify-center py-20">
        <!-- Main loading spinner -->
        <div class="relative mb-8">
          <div class="w-20 h-20 border-4 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
        </div>
        
        <!-- Loading text -->
        <div class="text-center">
          <p class="text-xl font-semibold text-slate-700 mb-2">Načítavame...</p>
        </div>

        <!-- Loading skeleton cards -->
        <div class="w-full mt-12 space-y-8">
          <!-- Skeleton cards grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div v-for="i in 6" :key="i" class="bg-white rounded-2xl shadow-lg p-6">
              <div class="h-48 bg-slate-200 rounded-xl mb-4"></div>
              <div class="space-y-3">
                <div class="h-4 bg-slate-200 rounded w-3/4"></div>
                <div class="h-4 bg-slate-200 rounded w-1/2"></div>
                <div class="flex space-x-2">
                  <div class="h-6 w-16 bg-slate-200 rounded-full"></div>
                  <div class="h-6 w-20 bg-slate-200 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Enhanced Error State -->
      <div v-if="error" class="mb-8">
        <div class="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-2xl p-6 shadow-lg">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <div class="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <span class="material-symbols-outlined text-red-600 text-lg">error</span>
              </div>
            </div>
            <div class="ml-4 flex-1">
              <h3 class="text-lg font-semibold text-red-800 mb-1">Ups! Niečo sa pokazilo</h3>
              <p class="text-red-700 mb-4">{{ error }}</p>
              <button 
                @click="error = null" 
                class="inline-flex items-center px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 font-medium rounded-lg transition-colors duration-200"
              >
                <span class="material-symbols-outlined mr-2 text-sm">close</span>
                Zavrieť
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Content when not loading -->
      <div v-if="!isLoading || error" class="mt-20">
        <section v-if="userRoom && !error">
          <!-- Section Header -->
          <div class="mb-8 text-center" v-if="displayableRoomApplicants.length > 0 || applicantsPending">
            <div class="flex items-center justify-center mb-4">
              <div class="bg-gradient-to-r from-slate-600 to-slate-700 rounded-full p-2 mr-3">
                <span class="material-symbols-outlined text-white text-xl">group</span>
              </div>
              <h2 class="text-3xl font-bold text-slate-800">Potencionálni spolubývajúci</h2>
              <span v-if="displayableRoomApplicants.length > 0" class="ml-3 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-semibold">
                {{ displayableRoomApplicants.length }}
              </span>
            </div>
            <div class="inline-block h-1 w-20 bg-gradient-to-r from-blue-700 to-blue-800 rounded-full"></div>
          </div>

          <!-- Loading applicants -->
          <div v-if="applicantsPending && displayableRoomApplicants.length === 0" class="text-center py-12">
            <div class="w-12 h-12 border-4 border-slate-300 border-t-blue-700 rounded-full animate-spin mx-auto mb-4"></div>
            <p class="text-slate-500 text-lg">Načítavanie spolubývajúcich...</p>
          </div>

          <!-- Applicants Grid -->
          <div v-else-if="displayableRoomApplicants.length > 0" class="flex flex-wrap justify-start gap-6">
            <div
              v-for="applicant in displayableRoomApplicants"
              :key="applicant.matchDocId"
              class="flex-none"
            >
              <RoommateItem :roommate="applicant.profile" />
              <MatchInfoDisplay :match-data="applicant.matchData" class="mt-3" />
            </div>
          </div>

          <!-- No applicants state -->
          <div v-else-if="!applicantsPending && displayableRoomApplicants.length === 0" class="bg-gradient-to-br from-blue-50 to-slate-50 rounded-3xl shadow-xl p-12 text-center border border-blue-100">
            <div class="relative inline-block mb-6">
              <div class="w-24 h-24 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center shadow-2xl">
                <span class="material-symbols-outlined text-4xl text-white">person_search</span>
              </div>
              <div class="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                <span class="material-symbols-outlined text-white text-sm">star</span>
              </div>
            </div>
            <h3 class="text-2xl font-bold mb-4 bg-gradient-to-r from-slate-600 to-slate-700 bg-clip-text text-transparent">
              Pre vašu izbu zatiaľ neboli nájdené žiadne zhody
            </h3>
            <p class="text-slate-600 mb-6 text-lg max-w-md mx-auto">
              Nové zhody sa môžu objaviť kedykoľvek. Skontrolujte neskôr!
            </p>
            <div class="text-4xl mb-3">🤷</div>
          </div>
        </section>

        <!-- No room state -->
        <section v-else-if="!userRoom && !userRoomPending && user && !error" class="bg-gradient-to-br from-blue-50 to-slate-50 rounded-3xl shadow-xl p-12 text-center border border-blue-100">
          <div class="relative inline-block mb-6">
            <div class="w-24 h-24 bg-gradient-to-br from-blue-700 to-blue-800 rounded-full flex items-center justify-center shadow-2xl">
              <span class="material-symbols-outlined text-4xl text-white">home_work</span>
            </div>
            <div class="absolute -top-2 -right-2 w-8 h-8 bg-red-400 rounded-full flex items-center justify-center">
              <span class="material-symbols-outlined text-white text-sm">add</span>
            </div>
          </div>
          <h2 class="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-700 to-blue-800 bg-clip-text text-transparent">
            Nemáte pridanú žiadnu izbu
          </h2>
          <p class="text-slate-600 mb-8 text-lg max-w-md mx-auto">
            Pridajte svoju izbu a začnite hľadať spolubývajúcich!
          </p>
          <NuxtLink
            to="/"
            class="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white font-semibold py-4 px-8 rounded-xl transition-colors duration-200 inline-flex items-center"
          >
            <span class="material-symbols-outlined mr-2">add_home</span>
            Pridať izbu
          </NuxtLink>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.material-symbols-outlined {
  font-variation-settings:
    'FILL' 1,
    'wght' 300,
    'GRAD' 0,
    'opsz' 48;
}

.bg-clip-text {
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>