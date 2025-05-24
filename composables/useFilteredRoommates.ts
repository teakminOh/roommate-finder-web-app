// composables/useFilteredRoommates.ts
import { ref, watch, type Ref, shallowRef, onMounted } from 'vue';
import { useFirestore } from 'vuefire';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  type QueryConstraint,
  GeoPoint
} from 'firebase/firestore';
import type { Roommate } from '~/types/user';
import type { EmittedFilters as RoommateBaseFilters } from '~/components/users/RoommateFilter.vue';

const PAGE_SIZE = 10;
const FIRESTORE_FETCH_LIMIT = PAGE_SIZE * 3; // Define it here, accessible to the whole composable

// --- Helper for Haversine distance calculation ---
function haversineDistance(
  // ... (haversineDistance function remains the same)
  coords1: { latitude: number; longitude: number },
  coords2: { latitude: number; longitude: number },
  isMiles: boolean = false
): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = isMiles ? 3959 : 6371;

  const dLat = toRad(coords2.latitude - coords1.latitude);
  const dLon = toRad(coords2.longitude - coords1.longitude);
  const lat1 = toRad(coords1.latitude);
  const lat2 = toRad(coords2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function useFilteredRoommates(
    filters: Ref<Partial<RoommateBaseFilters>>,
    currentPageInternal: Ref<number> = ref(1),
    pageStartCursorsInternal: Ref<Record<number, unknown>> = ref({ 1: null }),
    centerGeoPoint: Ref<GeoPoint | null>,
    searchRadiusKm: Ref<number>
) {
  const db = useFirestore();
  const roommatesCollection = collection(db, 'users');

  const allFetchedRoommates = shallowRef<Roommate[]>([]);
  const roommates = shallowRef<Roommate[]>([]);
  const pending = ref(true);
  const error = ref<Error | null>(null);
  const hasNextPage = ref(false);

  watch([filters, centerGeoPoint, searchRadiusKm], () => {
    console.log("useFilteredRoommates: Filters or geo params changed, resetting and fetching.");
    allFetchedRoommates.value = [];
    currentPageInternal.value = 1;
    pageStartCursorsInternal.value = { 1: null };
    fetchAndFilterRoommates();
  }, { deep: true });

  const applyClientSideFiltersAndPaginate = () => {
    // ... (applyClientSideFiltersAndPaginate function remains the same)
    let processedRoommates = allFetchedRoommates.value;

    if (centerGeoPoint?.value && searchRadiusKm?.value > 0) {
      console.log(`Applying geo filter for roommates: Center ${centerGeoPoint.value.latitude},${centerGeoPoint.value.longitude}, Radius ${searchRadiusKm.value}km`);
      const searchCenter = {
        latitude: centerGeoPoint.value.latitude,
        longitude: centerGeoPoint.value.longitude,
      };
      processedRoommates = processedRoommates.filter(roommate => {
        if (roommate.coordinates && typeof (roommate.coordinates as any).latitude === 'number' && typeof (roommate.coordinates as any).longitude === 'number') {
          const roommateLocation = {
            latitude: (roommate.coordinates as any).latitude,
            longitude: (roommate.coordinates as any).longitude,
          };
          const distance = haversineDistance(searchCenter, roommateLocation);
          return distance <= searchRadiusKm.value;
        }
        return false;
      });
      console.log(`Roommates after geo filter: ${processedRoommates.length}`);
    }

    const startIndex = (currentPageInternal.value - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    roommates.value = processedRoommates.slice(startIndex, endIndex);

    hasNextPage.value = processedRoommates.length > endIndex;
  };

  const fetchAndFilterRoommates = async (loadMoreFirestore = false) => {
    if (!loadMoreFirestore) {
        pending.value = true;
        // When not loading more, it's a fresh query (filters changed or initial load)
        // Resetting allFetchedRoommates is handled by the watcher now.
        // Cursors are also reset by the watcher.
    }
    error.value = null;

    const constraints: QueryConstraint[] = [];
    const currentFilters = filters.value;

    if (currentFilters) {
        if (currentFilters.gender) {
            constraints.push(where('gender', '==', currentFilters.gender));
        }

        // --- ADDED/CORRECTED AGE FILTER ---
        if (typeof currentFilters.minAge === 'number' && currentFilters.minAge >= 0) { // Or your min age (e.g. 16)
            constraints.push(where('age', '>=', currentFilters.minAge));
        }
        if (typeof currentFilters.maxAge === 'number' && currentFilters.maxAge > 0) { // Or your min age
            constraints.push(where('age', '<=', currentFilters.maxAge));
        }
        // --- END OF AGE FILTER ---


        // Budget Filters
        if (typeof currentFilters.minBudget === 'number' && currentFilters.minBudget >= 0) {
            constraints.push(where('budget', '>=', currentFilters.minBudget));
        }
        if (typeof currentFilters.maxBudget === 'number' && currentFilters.maxBudget > 0) {
            constraints.push(where('budget', '<=', currentFilters.maxBudget));
        }

        // Boolean-like filters from RoommateFilter.vue (isSmoker, hasPets, student)
        // The filter component sends `isSmoker: false` if "wantsNonSmoker" is checked.
        // It sends `hasPets: false` if "wantsNoPets" is checked.
        // It sends `student: true` if "isStudent" is checked.
        // If the checkbox is not checked for these, the key is omitted from the payload.
        if (typeof currentFilters.isSmoker === 'boolean') { // Will be true if `isSmoker: false` is in payload
            constraints.push(where('isSmoker', '==', currentFilters.isSmoker));
        }
        if (typeof currentFilters.hasPets === 'boolean') { // Will be true if `hasPets: false` is in payload
            constraints.push(where('hasPets', '==', currentFilters.hasPets));
        }
        if (currentFilters.student === true) { // Only filter for `student: true` if present
            constraints.push(where('student', '==', true));
        }
    }

    constraints.push(orderBy('updatedAt', 'desc'));
    // const firestoreFetchLimit = PAGE_SIZE * 3; // REMOVED from here

    const cursorForFirestorePage = pageStartCursorsInternal.value[Object.keys(pageStartCursorsInternal.value).length]; // Get the latest cursor
    if (loadMoreFirestore && cursorForFirestorePage) {
        constraints.push(startAfter(cursorForFirestorePage));
    }
    constraints.push(limit(FIRESTORE_FETCH_LIMIT)); // USE THE CONSTANT

    const constraintSummary = constraints.map(c => { /* ... (constraintSummary logging) ... */ });
    console.log("(Composable Roommates) Firestore Query Constraints:", constraintSummary.join(' || '));

    try {
        const snapshot = await getDocs(query(roommatesCollection, ...constraints));
        const fetchedFirestoreRoommates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Roommate);
        console.log(`Fetched ${fetchedFirestoreRoommates.length} roommates from Firestore.`);

        if (loadMoreFirestore) {
            allFetchedRoommates.value = [...allFetchedRoommates.value, ...fetchedFirestoreRoommates];
        } else {
            allFetchedRoommates.value = fetchedFirestoreRoommates;
        }

        const lastDoc = snapshot.docs[snapshot.docs.length - 1];
        if (snapshot.docs.length === FIRESTORE_FETCH_LIMIT && lastDoc) { // USE THE CONSTANT
            pageStartCursorsInternal.value[Object.keys(pageStartCursorsInternal.value).length + 1] = lastDoc;
        } else {
             // If fewer docs than limit were fetched, it means no more docs for this specific query set from Firestore
             // We might want to signify that no more Firestore fetches are needed for this query set
             // by removing the "next" cursor if it was optimistically set.
             // However, this needs careful handling if filters change. For now, let's keep it simple.
             // A more robust way is to set a flag like `noMoreDataFromFirestore = true`.
             delete pageStartCursorsInternal.value[Object.keys(pageStartCursorsInternal.value).length + 1]; // Clean up speculative next cursor if not full page
        }

        applyClientSideFiltersAndPaginate();

    } catch (err) {
        console.error("(Composable Roommates) Firestore fetch error:", err);
        error.value = err instanceof Error ? err : new Error('Failed to fetch roommates');
        allFetchedRoommates.value = [];
        roommates.value = [];
        hasNextPage.value = false;
    } finally {
        pending.value = false;
    }
  };

  onMounted(() => {
    fetchAndFilterRoommates(false);
  });

  const loadNextPage = () => {
    if (hasNextPage.value && !pending.value) {
      currentPageInternal.value++;
      const roomsNeededForCurrentUiPageDisplay = currentPageInternal.value * PAGE_SIZE;

      // Check if we have enough data in our client-side buffer (allFetchedRoommates)
      // If not, and we think there might be more data in Firestore, then fetch.
      const lastKnownFirestoreCursorKey = Object.keys(pageStartCursorsInternal.value).length;
      const hasPotentialFirestoreCursor = !!pageStartCursorsInternal.value[lastKnownFirestoreCursorKey];


      // Condition to fetch more from Firestore:
      // 1. We need more items for the current UI page than we have in our total buffer.
      // 2. EITHER:
      //    a. We have a valid "next" cursor stored (from fetching a full FIRESTORE_FETCH_LIMIT batch previously).
      //    b. OR, as a heuristic: the total items fetched is a multiple of FIRESTORE_FETCH_LIMIT,
      //       and we don't have an explicit "no more data" signal (which we don't have strongly implemented yet).
      const moreDataNeededThanBuffered = roomsNeededForCurrentUiPageDisplay > allFetchedRoommates.value.length;
      const isLastFirestoreFetchFull = allFetchedRoommates.value.length > 0 && allFetchedRoommates.value.length % FIRESTORE_FETCH_LIMIT === 0;
      const hasNextCursorStored = !!pageStartCursorsInternal.value[Object.keys(pageStartCursorsInternal.value).length]; // Check if the latest key has a cursor

      if (moreDataNeededThanBuffered && (hasNextCursorStored || isLastFirestoreFetchFull) ) {
          console.log("Need more roommate data from Firestore for next UI page display.");
          fetchAndFilterRoommates(true);
      } else {
          applyClientSideFiltersAndPaginate();
      }
    }
  };

  const loadPreviousPage = () => {
    // ... (loadPreviousPage function remains the same)
     if (currentPageInternal.value > 1 && !pending.value) {
        currentPageInternal.value--;
        applyClientSideFiltersAndPaginate();
    }
  };

  return {
    roommates,
    pending,
    error,
    currentPage: currentPageInternal,
    hasNextPage,
    loadNextPage,
    loadPreviousPage,
  };
}