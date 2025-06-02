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
  GeoPoint // Ensure GeoPoint is imported
} from 'firebase/firestore';
import type { Roommate } from '~/types/user'; // Assuming Roommate type includes 'occupation?: string;'
import type { EmittedFilters as RoommateBaseFilters } from '~/components/users/RoommateFilter.vue';

const PAGE_SIZE = 10;
const FIRESTORE_FETCH_LIMIT = PAGE_SIZE * 3;

// --- Helper for Haversine distance calculation ---
function haversineDistance(
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
  const roommates = shallowRef<Roommate[]>([]); // This will hold the currently visible page of roommates
  const pending = ref(true);
  const error = ref<Error | null>(null);
  const hasNextPage = ref(false);

  // Watch for changes in filters, centerGeoPoint, or searchRadiusKm
  watch([filters, centerGeoPoint, searchRadiusKm], () => {
    console.log("useFilteredRoommates: Filters, geoPoint, or radius changed. Resetting and fetching.");
    // Resetting all data and cursors for a new base query
    allFetchedRoommates.value = [];
    roommates.value = [];
    currentPageInternal.value = 1;
    pageStartCursorsInternal.value = { 1: null };
    hasNextPage.value = false; // Reset hasNextPage as well
    fetchAndFilterRoommates(false); // false indicates not loading more, but a fresh fetch
  }, { deep: true });


  const applyClientSideFiltersAndPaginate = () => {
    const currentFilters = filters.value;
    let processedRoommates = [...allFetchedRoommates.value]; // Start with a copy of all fetched roommates

    console.log(`Client-side processing: Starting with ${processedRoommates.length} roommates from Firestore buffer.`);

    // 1. Apply 'isWorking' filter (if active)
    // This filter means `occupation` should not be 'Nezamestnaný'.
    // If `occupation` is null, undefined, or any other string, it passes.
    if (currentFilters?.isWorking === true) {
      console.log("Applying client-side filter: isWorking (occupation !== 'Nezamestnaný')");
      processedRoommates = processedRoommates.filter(roommate => {
        return roommate.occupation !== 'Nezamestnaný';
      });
      console.log(`Roommates after 'isWorking' filter: ${processedRoommates.length}`);
    }

    // 2. Apply Geo-distance filter (if active)
    if (centerGeoPoint?.value && searchRadiusKm?.value > 0) {
      console.log(`Applying geo filter: Center ${centerGeoPoint.value.latitude},${centerGeoPoint.value.longitude}, Radius ${searchRadiusKm.value}km`);
      const searchCenter = {
        latitude: centerGeoPoint.value.latitude,
        longitude: centerGeoPoint.value.longitude,
      };
      processedRoommates = processedRoommates.filter(roommate => {
        // Ensure coordinates exist and are of the expected Firebase GeoPoint structure or a compatible object
        const coords = roommate.coordinates as any; // Cast to any for easier access, ensure your Roommate type is correct
        if (coords && typeof coords.latitude === 'number' && typeof coords.longitude === 'number') {
          const roommateLocation = {
            latitude: coords.latitude,
            longitude: coords.longitude,
          };
          const distance = haversineDistance(searchCenter, roommateLocation);
          return distance <= searchRadiusKm.value;
        }
        return false; // Roommate doesn't have valid coordinates for geo-filtering
      });
      console.log(`Roommates after geo filter: ${processedRoommates.length}`);
    }

    // 3. Paginate the fully client-side filtered list
    const startIndex = (currentPageInternal.value - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    roommates.value = processedRoommates.slice(startIndex, endIndex);

    hasNextPage.value = processedRoommates.length > endIndex;
    console.log(`Paginated view: Displaying ${roommates.value.length} roommates for page ${currentPageInternal.value}. Total processed after all client filters: ${processedRoommates.length}. Has next: ${hasNextPage.value}`);
  };


  const fetchAndFilterRoommates = async (loadMoreFirestore = false) => {
    if (!loadMoreFirestore) {
        pending.value = true;
        // Resetting of allFetchedRoommates and cursors is now primarily handled by the watcher
        // for changes in filters/geo-params.
        // This 'pending' flag is for the current fetch operation.
    }
    error.value = null;

    const constraints: QueryConstraint[] = [];
    const currentFilters = filters.value;

    // Firestore query constraints (applied server-side by Firestore)
    if (currentFilters) {
        if (currentFilters.gender) {
            constraints.push(where('gender', '==', currentFilters.gender));
        }
        if (typeof currentFilters.minAge === 'number' && currentFilters.minAge >= 16) {
            constraints.push(where('age', '>=', currentFilters.minAge));
        }
        if (typeof currentFilters.maxAge === 'number' && currentFilters.maxAge >= 16) {
            constraints.push(where('age', '<=', currentFilters.maxAge));
        }
        if (typeof currentFilters.minBudget === 'number' && currentFilters.minBudget >= 0) {
            constraints.push(where('budget', '>=', currentFilters.minBudget));
        }
        if (typeof currentFilters.maxBudget === 'number' && currentFilters.maxBudget > 0) {
            constraints.push(where('budget', '<=', currentFilters.maxBudget));
        }
        if (typeof currentFilters.isSmoker === 'boolean') {
            constraints.push(where('isSmoker', '==', currentFilters.isSmoker));
        }
        if (typeof currentFilters.hasPets === 'boolean') {
            constraints.push(where('hasPets', '==', currentFilters.hasPets));
        }
        if (currentFilters.student === true) {
            constraints.push(where('student', '==', true));
        }
        // Note: `isWorking` is handled client-side, so no Firestore constraint for it here.
    }

    constraints.push(orderBy('updatedAt', 'desc')); // Default sort order

    // Handle Firestore pagination (cursors)
    const lastKnownCursorKey = Object.keys(pageStartCursorsInternal.value).length;
    const cursorForFirestorePage = pageStartCursorsInternal.value[lastKnownCursorKey];

    if (loadMoreFirestore && cursorForFirestorePage) {
        console.log("Using startAfter cursor for Firestore pagination.");
        constraints.push(startAfter(cursorForFirestorePage));
    }
    constraints.push(limit(FIRESTORE_FETCH_LIMIT));

    const constraintSummary = constraints.map(c => {
        const type = (c as any)._type;
        if (type === 'where') return `WHERE ${(c as any)._fieldOp._field.segments.join('.')} ${(c as any)._fieldOp._op} '${(c as any)._fieldOp._value}'`;
        if (type === 'orderBy') return `ORDER BY ${(c as any)._orderBy._field.segments.join('.')} ${(c as any)._orderBy._direction}`;
        if (type === 'limit') return `LIMIT ${(c as any)._limit}`;
        if (type === 'startAfter') return `STARTAFTER`;
        return type;
    }).join(' || ');
    console.log("(Composable Roommates) Firestore Query Constraints:", constraintSummary);


    try {
        const snapshot = await getDocs(query(roommatesCollection, ...constraints));
        const fetchedFirestoreRoommates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Roommate);
        console.log(`Fetched ${fetchedFirestoreRoommates.length} roommates from Firestore this batch.`);

        if (loadMoreFirestore) {
            allFetchedRoommates.value = [...allFetchedRoommates.value, ...fetchedFirestoreRoommates];
        } else {
            allFetchedRoommates.value = fetchedFirestoreRoommates; // Replace if it's a fresh query
        }
        console.log(`Total roommates in client buffer (allFetchedRoommates): ${allFetchedRoommates.value.length}`);

        const lastDocInBatch = snapshot.docs[snapshot.docs.length - 1];
        if (fetchedFirestoreRoommates.length === FIRESTORE_FETCH_LIMIT && lastDocInBatch) {
            // Potential for more data from Firestore for this query set
            pageStartCursorsInternal.value[lastKnownCursorKey + 1] = lastDocInBatch;
            console.log("Stored cursor for next potential Firestore fetch.");
        } else {
            // Fewer docs than limit fetched, or no docs: no more data from Firestore for this query set
            // Remove any speculative next cursor if it exists for the *next* page beyond current
            delete pageStartCursorsInternal.value[lastKnownCursorKey + 1];
            console.log("End of Firestore results for this query or less than limit fetched. No next Firestore cursor stored for this path.");
        }
        
        applyClientSideFiltersAndPaginate(); // Apply client-side filters and update paginated view

    } catch (err) {
        console.error("(Composable Roommates) Firestore fetch error:", err);
        error.value = err instanceof Error ? err : new Error('Failed to fetch roommates');
        // Clear data on error
        allFetchedRoommates.value = [];
        roommates.value = [];
        hasNextPage.value = false;
    } finally {
        pending.value = false;
    }
  };

  onMounted(() => {
    if (allFetchedRoommates.value.length === 0) { // Fetch only if not already populated (e.g. by SSR)
        console.log("useFilteredRoommates: onMounted, initial fetch.");
        fetchAndFilterRoommates(false);
    } else {
        console.log("useFilteredRoommates: onMounted, data already present, applying client filters.");
        pending.value = true; // Set pending before potentially long client-side processing
        applyClientSideFiltersAndPaginate();
        pending.value = false;
    }
  });

  const loadNextPage = () => {
    if (pending.value) return; // Prevent multiple calls if already loading

    if (hasNextPage.value) {
      currentPageInternal.value++;
      console.log(`loadNextPage: Advanced to UI page ${currentPageInternal.value}.`);
      // Check if we have enough items in the client-side `processedRoommates` (after all filters)
      // to display this new page.
      // The `applyClientSideFiltersAndPaginate` function already updates `hasNextPage` based on `processedRoommates`.
      // We need to see if the `allFetchedRoommates` buffer potentially needs more from Firestore.

      const currentTotalClientBuffer = allFetchedRoommates.value.length;
      // Estimate how many items we *might* have after client-side filters for the next UI page
      const itemsNeededForNextUiPage = currentPageInternal.value * PAGE_SIZE;

      const lastKnownCursorKey = Object.keys(pageStartCursorsInternal.value).length;
      const hasPotentialFirestoreCursor = !!pageStartCursorsInternal.value[lastKnownCursorKey] &&
                                          typeof pageStartCursorsInternal.value[lastKnownCursorKey] !== 'undefined' &&
                                          pageStartCursorsInternal.value[lastKnownCursorKey] !== null;


      // Heuristic: If the number of items *currently displayed* for the new page would be less than PAGE_SIZE
      // AND we have a Firestore cursor (meaning last Firestore fetch was full), then fetch more.
      // This is tricky because client-side filters can reduce the count.
      // A simpler approach: if items needed for the current page end (after increment)
      // goes beyond what we have in `allFetchedRoommates`, and we have a next cursor, try fetching.
      if (itemsNeededForNextUiPage > currentTotalClientBuffer && hasPotentialFirestoreCursor) {
          console.log(`loadNextPage: Need more data from Firestore. Current buffer: ${currentTotalClientBuffer}, needed for page ${currentPageInternal.value}: ~${itemsNeededForNextUiPage}. Fetching more.`);
          fetchAndFilterRoommates(true); // true indicates loading more data from Firestore
      } else {
          console.log("loadNextPage: Using existing client buffer for pagination.");
          applyClientSideFiltersAndPaginate(); // Just re-paginate from existing client-side buffer
      }
    } else {
        console.log("loadNextPage: No next page or already pending.");
    }
  };

  const loadPreviousPage = () => {
    if (pending.value) return;
    if (currentPageInternal.value > 1) {
        currentPageInternal.value--;
        console.log(`loadPreviousPage: Moved to UI page ${currentPageInternal.value}.`);
        applyClientSideFiltersAndPaginate();
    }
  };

  return {
    roommates, // The paginated and filtered list for UI
    pending,
    error,
    currentPage: currentPageInternal,
    hasNextPage,
    loadNextPage,
    loadPreviousPage,
  };
}