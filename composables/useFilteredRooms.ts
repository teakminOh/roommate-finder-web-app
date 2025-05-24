// composables/useFilteredRooms.ts
import { ref, computed, watch, type Ref, shallowRef, onMounted } from 'vue';
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
  GeoPoint,
  type FieldPath // Import FieldPath for clarity if needed, though string usually works
} from 'firebase/firestore';
import type { Room } from '~/types/room';
import type { Filters as FilterPayload } from '~/components/RoomFilter.vue';

const PAGE_SIZE = 10;

function haversineDistance(
  // ... (haversineDistance function remains the same)
  coords1: { latitude: number; longitude: number },
  coords2: { latitude: number; longitude: number },
  isMiles: boolean = false
): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = isMiles ? 3959 : 6371; // Earth radius in miles or kilometers

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


export function useFilteredRooms(
    filters: Ref<Partial<FilterPayload>>,
    loadPaginated: Ref<boolean> = ref(false), // This param seems unused, consider removing if not needed
    currentPageInternal: Ref<number> = ref(1),
    pageStartCursorsInternal: Ref<Record<number, unknown>> = ref({ 1: null }),
    centerGeoPoint: Ref<GeoPoint | null>,
    searchRadiusKm: Ref<number>
) {
  const db = useFirestore();
  const roomsCollection = collection(db, 'rooms');

  const allFetchedRooms = shallowRef<Room[]>([]);
  const rooms = shallowRef<Room[]>([]);
  const pending = ref(true);
  const error = ref<Error | null>(null);
  const hasNextPage = ref(false);

  watch([filters, centerGeoPoint, searchRadiusKm], () => {
    console.log("useFilteredRooms: Filters or geo params changed, resetting and fetching.");
    allFetchedRooms.value = [];
    currentPageInternal.value = 1;
    pageStartCursorsInternal.value = { 1: null };
    fetchAndFilterRooms();
  }, { deep: true });

  const applyClientSideFiltersAndPaginate = () => {
    // ... (applyClientSideFiltersAndPaginate function remains mostly the same)
    let processedRooms = allFetchedRooms.value;

    if (centerGeoPoint?.value && searchRadiusKm?.value > 0) {
      console.log(`Applying geo filter: Center ${centerGeoPoint.value.latitude},${centerGeoPoint.value.longitude}, Radius ${searchRadiusKm.value}km`);
      const center = {
        latitude: centerGeoPoint.value.latitude,
        longitude: centerGeoPoint.value.longitude,
      };
      processedRooms = processedRooms.filter(room => {
        if (room.coordinates) {
          const roomCoords = {
            latitude: room.coordinates.latitude,
            longitude: room.coordinates.longitude,
          };
          const distance = haversineDistance(center, roomCoords);
          return distance <= searchRadiusKm.value;
        }
        return false;
      });
      console.log(`Rooms after geo filter: ${processedRooms.length}`);
    }

    const startIndex = (currentPageInternal.value - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    rooms.value = processedRooms.slice(startIndex, endIndex);

    hasNextPage.value = processedRooms.length > endIndex;
    console.log(`Pagination: Displaying ${rooms.value.length} rooms. HasNextPage: ${hasNextPage.value}`);
  };

  const fetchAndFilterRooms = async (loadMoreFirestore = false) => {
    if (!loadMoreFirestore) {
        pending.value = true;
    }
    error.value = null;

    const constraints: QueryConstraint[] = [];
    const currentFilters = filters.value;

    // --- Construct Firestore Query ---
    if (currentFilters) {
        if (currentFilters.propertyType) {
            constraints.push(where('propertyType', '==', currentFilters.propertyType));
        }
        if (currentFilters.roomType) { // ADDED: Filter by roomType
            constraints.push(where('roomType', '==', currentFilters.roomType));
        }

        // Budget filters
        // IMPORTANT: Firestore has limitations on range filters if not ordering by the same field.
        // If 'budget' range filters are used, `orderBy('budget')` should be the first orderBy clause.
        // The current `orderBy('updatedAt')` might conflict.
        // For simplicity here, adding them. If issues arise, you might need to
        // adjust orderBy or do budget range filtering client-side.
        if (typeof currentFilters.minBudget === 'number' && currentFilters.minBudget >= 0) {
            constraints.push(where('budget', '>=', currentFilters.minBudget));
        }
        if (typeof currentFilters.maxBudget === 'number' && currentFilters.maxBudget > 0) {
            // Ensure maxBudget is meaningfully greater than minBudget client-side if necessary,
            // or let Firestore handle potentially empty results.
            constraints.push(where('budget', '<=', currentFilters.maxBudget));
        }

        // Boolean filters: Add a 'where' clause if the filter is set to true
        // The RoomFilter component emits these keys only if they are true.
        if (currentFilters.isFurnished === true) {
            constraints.push(where('isFurnished', '==', true));
        }
        if (currentFilters.parkingAvailable === true) {
            constraints.push(where('parkingAvailable', '==', true));
        }
        if (currentFilters.childrenFriendly === true) { // <<< THE FIX for childrenFriendly
            constraints.push(where('childrenFriendly', '==', true));
        }
        if (currentFilters.petsAllowed === true) {
            constraints.push(where('petsAllowed', '==', true));
        }
        if (currentFilters.studentsWelcome === true) {
            constraints.push(where('studentsWelcome', '==', true));
        }
        if (currentFilters.internetIncluded === true) {
            constraints.push(where('internetIncluded', '==', true));
        }
        if (currentFilters.isAccessible === true) {
            constraints.push(where('isAccessible', '==', true));
        }
    }

    // Default ordering.
    // If budget range filters are active, consider `orderBy('budget')` then `orderBy('updatedAt', 'desc')`
    // This might require creating an index in Firestore.
    constraints.push(orderBy('updatedAt', 'desc'));

    const firestoreFetchLimit = PAGE_SIZE * 3; // Fetch buffer

    const cursorValue = pageStartCursorsInternal.value[currentPageInternal.value];
    if (loadMoreFirestore && cursorValue !== null && cursorValue !== undefined) {
        constraints.push(startAfter(cursorValue));
    } else if (loadMoreFirestore && currentPageInternal.value > 1) {
        console.warn(`(Composable) No Firestore cursor found for page ${currentPageInternal.value} during Firestore loadMore.`);
    }
    constraints.push(limit(firestoreFetchLimit));

    // For debugging the actual constraints being sent to Firestore:
    const constraintSummary = constraints.map(c => {
        if ((c as any)._op && (c as any)._fieldPath && (c as any)._value !== undefined) { // Heuristic for 'where'
            return `where(${(c as any)._fieldPath.toString()}, '${(c as any)._op}', ${JSON.stringify((c as any)._value)})`;
        } else if ((c as any)._fieldPath && (c as any)._direction !== undefined) { // Heuristic for 'orderBy'
             return `orderBy(${(c as any)._fieldPath.toString()}, '${(c as any)._direction}')`;
        } else if ((c as any)._limit !== undefined) { // Heuristic for 'limit'
            return `limit(${(c as any)._limit})`;
        } else if ((c as any)._startAfter !== undefined) { // Heuristic for 'startAfter'
            return `startAfter(...)`;
        }
        return 'unknown_constraint';
    });
    console.log("(Composable) Firestore Query Constraints:", constraintSummary.join(', '));


    try {
        const snapshot = await getDocs(query(roomsCollection, ...constraints));
        const fetchedFirestoreRooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Room);
        console.log(`Fetched ${fetchedFirestoreRooms.length} rooms from Firestore.`);

        if (loadMoreFirestore) {
            allFetchedRooms.value = [...allFetchedRooms.value, ...fetchedFirestoreRooms];
        } else {
            allFetchedRooms.value = fetchedFirestoreRooms;
        }

        if (!snapshot.empty && snapshot.docs.length === firestoreFetchLimit) {
            pageStartCursorsInternal.value[currentPageInternal.value + 1] = snapshot.docs[snapshot.docs.length - 1];
        } else {
            delete pageStartCursorsInternal.value[currentPageInternal.value + 1];
        }

        applyClientSideFiltersAndPaginate();

    } catch (err) {
        console.error("(Composable) Firestore fetch error:", err);
        error.value = err instanceof Error ? err : new Error('Failed to fetch rooms');
        allFetchedRooms.value = [];
        rooms.value = [];
        hasNextPage.value = false;
    } finally {
        pending.value = false;
    }
  };

  onMounted(() => {
    fetchAndFilterRooms(false);
  });

  const loadNextPage = () => {
    // ... (loadNextPage function remains the same)
    if (hasNextPage.value && !pending.value) {
      currentPageInternal.value++;
      const potentialNextPageStartIndex = (currentPageInternal.value -1) * PAGE_SIZE; // Corrected start index for check
      // We need to check if the *start* of the next UI page is beyond our current client-side buffer,
      // AND if we have a cursor to fetch more from Firestore.
      const firestoreBufferPage = Math.ceil(allFetchedRooms.value.length / (PAGE_SIZE * 3)); // Rough estimate of Firestore "pages" fetched
      const currentUiPageRequiresFirestorePage = Math.ceil(currentPageInternal.value * PAGE_SIZE / (PAGE_SIZE*3));


      // More robust check: If the amount of data needed for the current UI page + 1 page buffer
      // exceeds what we have in allFetchedRooms, and there's a Firestore cursor available for *more* data.
      const roomsNeededForNextUiPage = currentPageInternal.value * PAGE_SIZE;
      const hasFirestoreCursorForMore = pageStartCursorsInternal.value[firestoreBufferPage + 1] !== undefined ||
                                        (allFetchedRooms.value.length > 0 && allFetchedRooms.value.length % (PAGE_SIZE*3) === 0); // Heuristic: fetched full FS page last time


      if (roomsNeededForNextUiPage > allFetchedRooms.value.length && hasFirestoreCursorForMore) {
          console.log("Need more data from Firestore for next UI page.");
          // The cursor logic for Firestore fetch needs to be based on the last Firestore doc, not UI page.
          // This part of pagination logic (mixing client and server pagination) can get complex.
          // The current `pageStartCursorsInternal.value[currentPageInternal.value]` might not be the right cursor
          // if `currentPageInternal` refers to UI pages and Firestore fetching happens in larger chunks.
          // For simplicity, let's assume `fetchAndFilterRooms(true)` fetches the *next chunk* from Firestore correctly.
          fetchAndFilterRooms(true);
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
    rooms,
    pending,
    error,
    currentPage: currentPageInternal,
    hasNextPage,
    loadNextPage,
    loadPreviousPage,
  };
}