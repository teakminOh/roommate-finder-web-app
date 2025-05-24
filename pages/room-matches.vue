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

// ... (rest of the <script setup> logic: fetchFullProfiles, watchers, computed properties)
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
  <div class="container mx-auto m-6 mt-16 p-4 md:p-6">
    <h1 class="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-8">
        <span v-if="userRoomPending && !userRoom && user">Načítavanie informácií o vašej izbe...</span>
        <span v-else-if="userRoom">{{ roomDisplayName }} - Zhody</span>
        <span v-else-if="!userRoomPending && !userRoom && user">Nemáte pridanú žiadnu izbu</span>
        <span v-else-if="!user">Zhody pre vašu izbu</span> <!-- Fallback/initial before user loads -->
    </h1>

 

    <div >
      <div v-if="isLoading && !error" class="flex flex-col items-center justify-center h-64">
        <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-6"></div>
        <p class="text-xl text-gray-600 font-medium">Načítavame...</p>
      </div>

      <div v-if="error" class="mt-6 mb-8">
        <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow max-w-xl mx-auto">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">Ups! Niečo sa pokazilo.</h3>
              <p class="text-sm text-red-700 mt-1">{{ error }}</p>
              <button @click="error = null" class="mt-2 text-sm font-medium text-red-800 hover:text-red-900">Zatvoriť</button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!isLoading || error">
        <section v-if="userRoom && !error">
          <!-- No room selector needed as user has only one room -->
          <div class="mb-6 text-center" v-if="displayableRoomApplicants.length > 0 || applicantsPending">
            <h2 class="text-2xl font-semibold text-gray-800">
                Potencionálni spolubývajúci
            </h2>
            <div class="inline-block h-1 w-20 bg-blue-500 mt-2"></div>
          </div>


         
          <div v-else class="bg-gray-50 mx-auto w-2/3 rounded-lg p-8 text-center border border-dashed border-gray-300">
            <div class="text-4xl mb-3">🧑</div>
            <p class="text-gray-600">Zatiaľ žiadne odporúčania pre spolubývajúcich. Vráťťe sa neskôr.</p>
          </div>
          <div v-if="applicantsPending && displayableRoomApplicants.length === 0" class="text-center text-gray-500 py-8">
            <p>Načítavanie spolubývajúcich...</p>
          </div>
          <div v-else-if="displayableRoomApplicants.length > 0" class="flex flex-wrap justify-center gap-6">
            <div
              v-for="applicant in displayableRoomApplicants"
              :key="applicant.matchDocId"
              class="flex-none"
            >
              <RoommateItem :roommate="applicant.profile" />
              <MatchInfoDisplay :match-data="applicant.matchData" class="mt-3" />
            </div>
          </div>
          <div v-else-if="!applicantsPending && displayableRoomApplicants.length === 0" class="bg-gray-50 mx-auto w-full max-w-lg rounded-lg p-8 text-center border border-dashed border-gray-300">
            <div class="text-4xl mb-3">🤷</div>
            <p class="text-gray-600">Pre vašu izbu zatiaľ neboli nájdené žiadne zhody spolubývajúcich.</p>
            <p class="text-sm text-gray-500 mt-2">Nové zhody sa môžu objaviť kedykoľvek. Skontrolujte neskôr!</p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>