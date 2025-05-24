<!-- pages/matches.vue -->
<script setup lang="ts">
import { ref, computed, watch, shallowRef } from 'vue';
import { useCurrentUser, useFirestore, useCollection } from 'vuefire';
import {
    collection, query, where, orderBy, limit, doc, getDocs, documentId,
    type DocumentData, type FirestoreError
} from 'firebase/firestore';

// --- Type Imports ---
import type { MatchUserUserData, MatchUserRoomData } from '~/types/match';
import type { Roommate } from '~/types/user';
import type { Room } from '~/types/room';
import type { DisplayableUserMatch, DisplayableRoomMatch } from '~/types/match';

// Import display components
import RoommateItem from '~/components/users/RoommateItem.vue';
import RoomItem from '~/components/rooms/RoomItem.vue';
import MatchInfoDisplay from '~/components/matches/MatchInfoDisplay.vue';

// --- Config ---
const MAX_MATCHES_TO_LOAD = 50;

// --- State ---
const isLoading = ref(true);
const error = ref<string | null>(null);
const displayableUserMatches = shallowRef<DisplayableUserMatch[]>([]);
const displayableRoomMatches = shallowRef<DisplayableRoomMatch[]>([]);
const activeTab = ref('all');

// --- Firebase ---
const user = useCurrentUser();
const db = useFirestore();

// --- Reactive Queries ---
const userMatchesQuery = computed(() => {
  if (!user.value) return null;
  return query(
    collection(db, 'matches'),
    where('type', '==', 'user-user'),
    where('uids', 'array-contains', user.value.uid),
    orderBy('score', 'desc'),
    limit(MAX_MATCHES_TO_LOAD)
  );
});

const roomMatchesQuery = computed(() => {
  if (!user.value) return null;
  return query(
    collection(db, 'matches'),
    where('type', '==', 'user-room'),
    where('userId', '==', user.value.uid),
    orderBy('score', 'desc'),
    limit(MAX_MATCHES_TO_LOAD)
  );
});

// --- Real-time Match Data ---
const { data: rawUserMatches, pending: userMatchesPending, error: userMatchesError } = useCollection(userMatchesQuery);
const { data: rawRoomMatches, pending: roomMatchesPending, error: roomMatchesError } = useCollection(roomMatchesQuery);

// --- Helper: Fetch full profiles (non-reactive) ---
async function fetchFullProfiles<T extends { id: string }>(
    collectionName: 'users' | 'rooms',
    ids: string[]
): Promise<{ [id: string]: T }> {
    if (!ids || ids.length === 0) return {};
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length === 0) return {};

    const profiles: { [id: string]: T } = {};
    const idChunks: string[][] = [];
    const CHUNK_SIZE = 30;

    for (let i = 0; i < uniqueIds.length; i += CHUNK_SIZE) {
        idChunks.push(uniqueIds.slice(i, i + CHUNK_SIZE));
    }
    console.log(`Fetching ${collectionName} profiles for IDs:`, uniqueIds);
    try {
        for (const chunk of idChunks) {
            if (chunk.length > 0) {
                const q = query(collection(db, collectionName), where(documentId(), 'in', chunk));
                const snapshot = await getDocs(q);
                snapshot.forEach(docSnap => {
                    profiles[docSnap.id] = { ...docSnap.data(), id: docSnap.id } as T;
                });
            }
        }
    } catch (e) { console.error(`Error fetching profiles from ${collectionName}:`, e); }
    return profiles;
}

// --- Watcher to Process Matches when Raw Data Changes ---
watch(
    [rawUserMatches, rawRoomMatches, user],
    async ([newRawUserMatches, newRawRoomMatches, currentUser], [oldUserMatches, oldRoomMatches, oldUser]) => {
        if (!currentUser) {
            displayableUserMatches.value = [];
            displayableRoomMatches.value = [];
            isLoading.value = false;
            error.value = null;
            console.log("User logged out, clearing matches.");
            return;
        }
        
        if (!newRawUserMatches || !newRawRoomMatches) {
             console.log("Waiting for initial match data...");
             isLoading.value = userMatchesPending.value || roomMatchesPending.value;
             return;
        }

        console.log("Raw matches changed, processing...");
        isLoading.value = true;
        error.value = null;

        try {
            const currentUserId = currentUser.uid;

            // --- Extract IDs to Fetch ---
            const userIdsToFetch = new Set<string>();
            (newRawUserMatches as MatchUserUserData[]).forEach(match => {
                 const otherId = match.uids.find(uid => uid !== currentUserId);
                 if(otherId) userIdsToFetch.add(otherId);
            });

            const roomIdsToFetch = new Set<string>();
             (newRawRoomMatches as MatchUserRoomData[]).forEach(match => {
                 if(match.roomId) roomIdsToFetch.add(match.roomId);
             });

            // --- Fetch Profiles ---
            const [userProfilesMap, roomProfilesMap] = await Promise.all([
                fetchFullProfiles<Roommate>('users', Array.from(userIdsToFetch)),
                fetchFullProfiles<Room>('rooms', Array.from(roomIdsToFetch))
            ]);

            // --- Combine and Update Display Arrays ---
            const finalUserMatches: DisplayableUserMatch[] = [];
            (newRawUserMatches as MatchUserUserData[]).forEach(matchData => {
                const otherUserId = matchData.uids.find(uid => uid !== currentUserId);
                const profile = otherUserId ? userProfilesMap[otherUserId] : null;
                if (profile) {
                    finalUserMatches.push({ profile: profile, matchData: matchData, matchDocId: (matchData as any).id || otherUserId });
                } else if(otherUserId) { console.warn(`Profile not found for user ${otherUserId}`);}
            });

            const finalRoomMatches: DisplayableRoomMatch[] = [];
            (newRawRoomMatches as MatchUserRoomData[]).forEach(matchData => {
                const profile = roomProfilesMap[matchData.roomId];
                if (profile) {
                    finalRoomMatches.push({ profile: profile, matchData: matchData, matchDocId: (matchData as any).id || matchData.roomId });
                } else if(matchData.roomId) { console.warn(`Profile not found for room ${matchData.roomId}`); }
            });

            // Sort
            finalUserMatches.sort((a, b) => b.matchData.score - a.matchData.score);
            finalRoomMatches.sort((a, b) => b.matchData.score - a.matchData.score);

            displayableUserMatches.value = finalUserMatches;
            displayableRoomMatches.value = finalRoomMatches;
            console.log("Displayable matches updated.");

        } catch (err: any) {
            console.error("Error processing matches or fetching profiles:", err);
            error.value = `Failed to process matches: ${err.message || 'Unknown error'}`;
        } finally {
            isLoading.value = false;
        }
    },
    { immediate: true }
);

// Watch for errors from useCollection
watch([userMatchesError, roomMatchesError], ([uError, rError]) => {
    if (uError) {
        console.error("Firestore user matches listener error:", uError);
        error.value = "Error loading roommate matches.";
    }
    if (rError) {
        console.error("Firestore room matches listener error:", rError);
        error.value = "Error loading room matches.";
    }
     if(uError || rError) isLoading.value = false;
});

// Watch pending state from useCollection for initial load
watch([userMatchesPending, roomMatchesPending], ([uPending, rPending]) => {
    if (user.value && (uPending || rPending)) {
        isLoading.value = true;
    }
}, { immediate: true });

// Check if there are any matches to display for the current tab
const hasAnyMatches = computed(() => {
  if (activeTab.value === 'all') {
    return displayableUserMatches.value.length > 0 || displayableRoomMatches.value.length > 0
  } else if (activeTab.value === 'rooms') {
    return displayableRoomMatches.value.length > 0
  } else if (activeTab.value === 'roommates') {
    return displayableUserMatches.value.length > 0
  }
  return false
})
</script>

<template>
  <div class="bg-slate-50 min-h-screen -mt-4">
    <!-- Enhanced Header -->
    <div class="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white py-16 px-3 sm:px-10 shadow-2xl overflow-hidden">
      <div class="absolute inset-0 bg-black/10"></div>
      <div class="absolute top-0 left-0 w-full h-full">
        <div class="absolute top-10 left-10 w-20 h-20 bg-white/5 rounded-full"></div>
        <div class="absolute top-20 right-20 w-16 h-16 bg-white/10 rounded-full"></div>
        <div class="absolute bottom-10 left-1/4 w-12 h-12 bg-white/5 rounded-full"></div>
      </div>
      <div class="max-w-6xl mx-auto relative z-10">
        <div class="flex items-center mb-4">
          <div class="bg-white/20 backdrop-blur-sm rounded-full p-3 mr-4">
            <span class="material-symbols-outlined text-3xl">favorite</span>
          </div>
          <div>
            <h1 class="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Vaše odporúčania
            </h1>
            <p class="text-blue-100 text-lg">Najlepšie zhody pre vás na jednom mieste</p>
          </div>
        </div>
      </div>
    </div>



    <!-- Main Content -->
    <div  class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
      <!-- Enhanced Loading State -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-20">
        <!-- Main loading spinner -->
        <div class="relative mb-8">
          <div class="w-20 h-20 border-4 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
        </div>
        
        <!-- Loading text -->
        <div class="text-center">
          <p class="text-xl font-semibold text-slate-700 mb-2">Hľadáme odporúčania...</p>
        </div>

        <!-- Loading skeleton cards -->
        <div class="w-full mt-12 space-y-8">
          <!-- Skeleton tab navigation -->
          <div class="flex justify-center">
            <div class="bg-white/90 backdrop-blur-lg shadow-2xl rounded-2xl p-2 flex gap-2 border border-slate-200">
              <div class="h-12 w-32 bg-slate-200 rounded-xl"></div>
              <div class="h-12 w-24 bg-slate-200 rounded-xl"></div>
              <div class="h-12 w-36 bg-slate-200 rounded-xl"></div>
            </div>
          </div>
          
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

      <!-- Error State -->
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
      <div v-if="!isLoading && !error">
        <!-- Enhanced Tab Navigation -->
        <div class="flex justify-center mb-12">
          <div class="bg-white/90 backdrop-blur-lg shadow-2xl rounded-2xl p-2 flex gap-2 border border-slate-200">
            <button
              @click="activeTab = 'all'"
              class="flex items-center px-6 py-3 rounded-xl font-semibold transition-colors duration-200"
              :class="activeTab === 'all' 
                ? 'bg-gradient-to-r from-blue-700 to-blue-800 text-white shadow-lg' 
                : 'text-slate-700 hover:bg-slate-100'">
            
              <span class="material-symbols-outlined mr-2 text-lg">star</span>
              Všetky
              <span v-if="(displayableRoomMatches.length + displayableUserMatches.length) > 0" 
                    :class="activeTab === 'all' ? 'bg-white/20' : 'bg-blue-100 text-blue-700'"
                    class="ml-2 px-2 py-0.5 rounded-full text-xs font-bold">
                {{ displayableRoomMatches.length + displayableUserMatches.length }}
              </span>
            </button>
            
            <button
              @click="activeTab = 'rooms'"
              class="flex items-center px-6 py-3 rounded-xl font-semibold transition-colors duration-200"
              :class="activeTab === 'rooms' 
                ? 'bg-gradient-to-r from-blue-700 to-blue-800 text-white shadow-lg' 
                : 'text-slate-700 hover:bg-slate-100'"
            >
              <span class="material-symbols-outlined mr-2 text-lg">home</span>
              Izby
              <span v-if="displayableRoomMatches.length > 0" 
                    :class="activeTab === 'rooms' ? 'bg-white/20' : 'bg-blue-100 text-blue-700'"
                    class="ml-2 px-2 py-0.5 rounded-full text-xs font-bold">
                {{ displayableRoomMatches.length }}
              </span>
            </button>
            
            <button
              @click="activeTab = 'roommates'"
              class="flex items-center px-6 py-3 rounded-xl font-semibold transition-colors duration-200"
              :class="activeTab === 'roommates' 
                ? 'bg-gradient-to-r from-blue-700 to-blue-800 text-white shadow-lg' 
                : 'text-slate-700 hover:bg-slate-100'"
            >
              <span class="material-symbols-outlined mr-2 text-lg">group</span>
              Spolubývajúci
              <span v-if="displayableUserMatches.length > 0" 
                    :class="activeTab === 'roommates' ? 'bg-white/20' : 'bg-blue-100 text-blue-700'"
                    class="ml-2 px-2 py-0.5 rounded-full text-xs font-bold">
                {{ displayableUserMatches.length }}
              </span>
            </button>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="!hasAnyMatches" class="bg-gradient-to-br from-blue-50 to-slate-50 rounded-3xl shadow-xl p-12 text-center border border-blue-100">
          <div class="relative inline-block mb-6">
            <div class="w-24 h-24 bg-gradient-to-br from-blue-700 to-blue-800 rounded-full flex items-center justify-center shadow-2xl">
              <span class="material-symbols-outlined text-4xl text-white">auto_awesome</span>
            </div>
            <div class="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
              <span class="material-symbols-outlined text-white text-sm">star</span>
            </div>
          </div>
          <h2 class="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-700 to-blue-800 bg-clip-text text-transparent">
            Zatiaľ žiadne odporúčania
          </h2>
          <p class="text-slate-600 mb-8 text-lg max-w-md mx-auto">
            Začnite objavovať a nájdite svojich ideálnych spolubývajúcich a izby!
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <NuxtLink
              to="/searchroom"
              class="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white font-semibold py-4 px-8 rounded-xl transition-colors duration-200 flex items-center justify-center"
            >
              <span class="material-symbols-outlined mr-2">home</span>
              Prehliadať izby
            </NuxtLink>
            <NuxtLink
              to="/searchuser"
              class="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white font-semibold py-4 px-8 rounded-xl transition-colors duration-200 flex items-center justify-center"
            >
              <span class="material-symbols-outlined mr-2">group</span>
              Nájsť spolubývajúcich
            </NuxtLink>
          </div>
        </div>

        <!-- Show matches based on selected tab -->
        <div v-else class="space-y-12">
          <!-- Rooms section -->
          <section v-if="(displayableRoomMatches.length > 0) && (activeTab === 'all' || activeTab === 'rooms')">
            <div class="flex items-center mb-8">
              <div class="bg-gradient-to-r from-blue-700 to-blue-800 rounded-full p-2 mr-3">
                <span class="material-symbols-outlined text-white text-xl">home</span>
              </div>
              <h2 class="text-3xl font-bold text-slate-800">Potencionálne izby</h2>
              <span class="ml-3 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                {{ displayableRoomMatches.length }}
              </span>
            </div>
            <div class="flex flex-wrap justify-between gap-4">
              <div
                v-for="item in displayableRoomMatches"
                :key="item.matchDocId"
              >
                <RoomItem :room="item.profile" />
                <MatchInfoDisplay :match-data="item.matchData" />
              </div>
            </div>
          </section>

          <!-- Roommates section -->
          <section v-if="(displayableUserMatches.length > 0) && (activeTab === 'all' || activeTab === 'roommates')">
            <div class="flex items-center mb-8">
              <div class="bg-gradient-to-r from-slate-600 to-slate-700 rounded-full p-2 mr-3">
                <span class="material-symbols-outlined text-white text-xl">group</span>
              </div>
              <h2 class="text-3xl font-bold text-slate-800">Potencionálni spolubývajúci</h2>
              <span class="ml-3 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-semibold">
                {{ displayableUserMatches.length }}
              </span>
            </div>
            <div class="flex flex-wrap justify-between gap-4">
              <div
                v-for="item in displayableUserMatches"
                :key="item.matchDocId"
              >
                <RoommateItem :roommate="item.profile" />
                <MatchInfoDisplay :match-data="item.matchData" />
              </div>
            </div>
          </section>
        </div>
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
</style>