// ~/composables/useListing.ts
import { ref, computed, shallowRef, onMounted } from 'vue';
import { useFirestore } from 'vuefire';
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  type Timestamp as FirestoreClientTimestamp,
  type DocumentData,
  type QueryConstraint,
  // Removed 'where' as it's not used in this version for filtering unless you add back isActivelyLooking
} from 'firebase/firestore';

import type { Room as OriginalRoom } from '~/types/room';
import type { Roommate as OriginalRoommate } from '~/types/user';
import type { Listing, RoomListing, RoommateAdListing, FirestoreCompatibleDate } from '~/types/listing';

const INITIAL_FETCH_PER_SOURCE = 7; // Fetch this many initially from each
const LOAD_MORE_FETCH_PER_SOURCE = 5; // Fetch this many more from each on "load more"
const ITEMS_PER_PAGE_DISPLAY = 8;   // How many to show initially and add per "load more" click

export function useListings() {
  console.log("DEBUG: useListings: Composable instance created.");
  const db = useFirestore();
  const roomsCollection = collection(db, 'rooms');
  const usersCollection = collection(db, 'users');

  // This will hold ALL items fetched and sorted so far from all sources
  const allFetchedSortedListings = shallowRef<Listing[]>([]);
  // This is what the UI will display (a capped portion of allFetchedSortedListings)
  const listings = shallowRef<Listing[]>([]);

  const pending = ref(true); // Start as true for the very first fetch operation
  const error = ref<string | null>(null);

  const lastRoomDoc = ref<DocumentData | null>(null);
  const hasNextPageRooms = ref(true); // Firestore might have more rooms

  const lastRoommateDoc = ref<DocumentData | null>(null);
  const hasNextPageRoommates = ref(true); // Firestore might have more users

  const currentDisplayCount = ref(0); // How many items are currently targeted for display

  const normalizeDate = (dateValue: FirestoreCompatibleDate | undefined): number => {
    if (!dateValue) return 0;
    if (dateValue instanceof Date) return dateValue.getTime();
    if (typeof dateValue === 'number') return dateValue; // Assuming it's already a timestamp
    if (typeof dateValue === 'string') return new Date(dateValue).getTime();
    // Check for Firestore Timestamp (client-side)
    if (dateValue && typeof (dateValue as FirestoreClientTimestamp).toDate === 'function') {
        return (dateValue as FirestoreClientTimestamp).toDate().getTime();
    }
    console.warn("DEBUG: Could not normalize date:", dateValue);
    return 0;
  };

  const updateDisplayedListings = () => {
    listings.value = allFetchedSortedListings.value.slice(0, currentDisplayCount.value);
    console.log(`DEBUG: updateDisplayedListings: Displaying ${listings.value.length} of ${allFetchedSortedListings.value.length} total fetched. Target display count: ${currentDisplayCount.value}`);
  };

  const fetchAllListings = async (isSubsequentFetchForMore = false) => {
    // isSubsequentFetchForMore is true if loadMore() decided it needs to hit Firestore again
    console.log(`DEBUG: fetchAllListings START. isSubsequentFetchForMore: ${isSubsequentFetchForMore}, pending: ${pending.value}`);

    // Set pending true only if we are actually going to hit Firestore
    // If !isSubsequentFetchForMore, it's the initial load, so set pending.
    // If isSubsequentFetchForMore, pending was already set by loadMore().
    if (!isSubsequentFetchForMore) {
        pending.value = true;
        allFetchedSortedListings.value = []; // Clear everything for a fresh start
        listings.value = [];
        lastRoomDoc.value = null;
        lastRoommateDoc.value = null;
        hasNextPageRooms.value = true;
        hasNextPageRoommates.value = true;
        currentDisplayCount.value = ITEMS_PER_PAGE_DISPLAY; // Target for the first display
        console.log("DEBUG: fetchAllListings: Initial load setup. currentDisplayCount:", currentDisplayCount.value);
    }
    error.value = null;

    let newFetchedRooms: RoomListing[] = [];
    let newFetchedRoommates: RoommateAdListing[] = [];
    const promises = [];

    // Determine fetch limits
    const roomFetchLimit = allFetchedSortedListings.value.length === 0 ? INITIAL_FETCH_PER_SOURCE : LOAD_MORE_FETCH_PER_SOURCE;
    const roommateFetchLimit = allFetchedSortedListings.value.length === 0 ? INITIAL_FETCH_PER_SOURCE : LOAD_MORE_FETCH_PER_SOURCE;

    console.log(`DEBUG: Fetch limits: Rooms=${roomFetchLimit}, Roommates=${roommateFetchLimit}`);
    console.log(`DEBUG: BEFORE ROOM FETCH: hasNextPageRooms: ${hasNextPageRooms.value}, lastRoomDoc ID: ${lastRoomDoc.value?.id || 'null'}`);

    // 1. Fetch Rooms
    if (hasNextPageRooms.value) {
        const roomQueryConstraints: QueryConstraint[] = [];
        roomQueryConstraints.push(orderBy('updatedAt', 'desc'));
        // Use lastRoomDoc.value for pagination if it exists (i.e., not the very first fetch for this source)
        if (lastRoomDoc.value) {
            console.log("DEBUG: ROOMS - Adding startAfter with doc ID:", lastRoomDoc.value.id);
            roomQueryConstraints.push(startAfter(lastRoomDoc.value));
        }
        roomQueryConstraints.push(limit(roomFetchLimit));
        const finalRoomQuery = query(roomsCollection, ...roomQueryConstraints);

        promises.push(
            getDocs(finalRoomQuery).then(snapshot => {
                console.log(`DEBUG: Fetched Room Snapshot: ${snapshot.docs.length} docs / Limit: ${roomFetchLimit}`);
                if (!snapshot.empty) {
                    lastRoomDoc.value = snapshot.docs[snapshot.docs.length - 1];
                }
                hasNextPageRooms.value = snapshot.docs.length === roomFetchLimit;
                newFetchedRooms = snapshot.docs.map(doc => {
                    const data = { id: doc.id, ...doc.data() } as OriginalRoom;
                    return {
                        id: doc.id, listingType: 'room', updatedAtNormalized: normalizeDate(data.updatedAt),
                        displayTitle: `${data.propertyType} in ${data.location || 'Neznáme'}`,
                        displayImage: data.images?.[0], locationText: data.location || data.zip,
                        budgetDisplay: `€${data.budget}${data.rentWithBills ? ' (vrátane energií)' : ''}`,
                        originalData: data, propertyType: data.propertyType, roomBudgetValue: data.budget,
                    } as RoomListing;
                });
            }).catch(err => {
                console.error("DEBUG: Error fetching rooms:", err);
                error.value = (error.value || "") + "Failed to fetch rooms. " + (err as Error).message;
                hasNextPageRooms.value = false;
            })
        );
    } else { console.log("DEBUG: Skipping room fetch, hasNextPageRooms is false."); }

    // 2. Fetch Users (Roommates)
    console.log(`DEBUG: BEFORE USER FETCH: hasNextPageRoommates: ${hasNextPageRoommates.value}, lastRoommateDoc ID: ${lastRoommateDoc.value?.id || 'null'}`);
    if (hasNextPageRoommates.value) {
        const roommateQueryConstraints: QueryConstraint[] = [];
        // Optional: where('isActivelyLooking', '==', true) -> if so, import 'where'
        roommateQueryConstraints.push(orderBy('updatedAt', 'desc'));
        if (lastRoommateDoc.value) {
            console.log("DEBUG: USERS - Adding startAfter with doc ID:", lastRoommateDoc.value.id);
            roommateQueryConstraints.push(startAfter(lastRoommateDoc.value));
        }
        roommateQueryConstraints.push(limit(roommateFetchLimit));
        const finalRoommateQuery = query(usersCollection, ...roommateQueryConstraints);

        promises.push(
            getDocs(finalRoommateQuery).then(snapshot => {
                console.log(`DEBUG: Fetched Roommate Snapshot: ${snapshot.docs.length} docs / Limit: ${roommateFetchLimit}`);
                if (!snapshot.empty) {
                    lastRoommateDoc.value = snapshot.docs[snapshot.docs.length - 1];
                }
                hasNextPageRoommates.value = snapshot.docs.length === roommateFetchLimit;
                newFetchedRoommates = snapshot.docs.map(doc => {
                    const data = { id: doc.id, ...doc.data() } as OriginalRoommate;
                    return {
                        id: doc.id, listingType: 'roommateAd', updatedAtNormalized: normalizeDate(data.updatedAt),
                        displayTitle: `Profil: ${data.firstName || 'Používateľ'} (${data.age || 'N/A'}r.)`,
                        displayImage: data.images?.[0], locationText: data.location,
                        budgetDisplay: data.budget ? `Rozpočet: €${data.budget}` : 'Rozpočet neuvedený',
                        originalData: data, roommateFirstName: data.firstName,
                    } as RoommateAdListing;
                });
            }).catch(err => {
                console.error("DEBUG: Error fetching roommates (users):", err);
                error.value = (error.value || "") + "Failed to fetch roommates. " + (err as Error).message;
                hasNextPageRoommates.value = false;
            })
        );
    } else { console.log("DEBUG: Skipping roommate fetch, hasNextPageRoommates is false."); }

    await Promise.allSettled(promises);
    console.log(`DEBUG: Promises settled. New rooms: ${newFetchedRooms.length}, New roommates: ${newFetchedRoommates.length}`);

    if (newFetchedRooms.length > 0 || newFetchedRoommates.length > 0) {
        // Add new items to the master list and re-sort
        allFetchedSortedListings.value = [...allFetchedSortedListings.value, ...newFetchedRooms, ...newFetchedRoommates];
        allFetchedSortedListings.value.sort((a, b) => b.updatedAtNormalized - a.updatedAtNormalized);
        console.log(`DEBUG: allFetchedSortedListings updated. Total count: ${allFetchedSortedListings.value.length}`);
    }

    updateDisplayedListings(); // Update the reactive `listings` array based on `currentDisplayCount`

    pending.value = false;
    console.log(`DEBUG: fetchAllListings END. pending: ${pending.value}, hasNextRooms: ${hasNextPageRooms.value}, hasNextRoommates: ${hasNextPageRoommates.value}`);
  };

  onMounted(() => {
    console.log("DEBUG: useListings: onMounted hook, calling fetchAllListings for initial display.");
    fetchAllListings(false); // false means it's the initial, non-loadMore fetch
  });

  const loadMore = () => {
    console.log(`DEBUG: loadMore called. currentDisplayCount: ${currentDisplayCount.value}, allFetchedCount: ${allFetchedSortedListings.value.length}, pending: ${pending.value}`);
    if (pending.value) {
        console.log("DEBUG: loadMore: Exiting because pending is true.");
        return;
    }

    // Check if we can show more from buffer OR if we can fetch more from Firestore
    const canShowMoreFromBuffer = currentDisplayCount.value < allFetchedSortedListings.value.length;
    const canFetchMoreFromFirestore = hasNextPageRooms.value || hasNextPageRoommates.value;

    if (!canShowMoreFromBuffer && !canFetchMoreFromFirestore) {
        console.log("DEBUG: loadMore: No more items in buffer and no more from Firestore. Exiting.");
        return;
    }

    // Increment the number of items to display
    currentDisplayCount.value += ITEMS_PER_PAGE_DISPLAY;
    console.log(`DEBUG: loadMore: Incremented currentDisplayCount to ${currentDisplayCount.value}`);

    // If we need more items than we currently have in our `allFetchedSortedListings` buffer
    // to satisfy the new currentDisplayCount, AND Firestore *might* have more, then fetch more from Firestore.
    if (currentDisplayCount.value > allFetchedSortedListings.value.length && canFetchMoreFromFirestore) {
      console.log("DEBUG: loadMore: Need more items from Firestore. Fetching...");
      pending.value = true; // Set pending for this Firestore fetch
      fetchAllListings(true); // true indicates it's a subsequent fetch to get more data for the buffer
    } else {
      // We have enough in the buffer, or no more in Firestore; just update the displayed portion
      updateDisplayedListings();
      console.log("DEBUG: loadMore: Displaying more from buffer or no more new items to fetch from Firestore.");
    }
  };

  // This computed property now determines if "Load More" should be shown
  const hasNextPage = computed(() => {
    if (pending.value && listings.value.length === 0) return false; // Don't show if initial load is pending

    const canShowMoreFromBuffer = currentDisplayCount.value < allFetchedSortedListings.value.length;
    const canPotentiallyFetchMoreFromFirestore = hasNextPageRooms.value || hasNextPageRoommates.value;
    // Show "Load More" if we can reveal more from the buffer, OR if we think Firestore might have more (and we might need them)
    const result = canShowMoreFromBuffer || (canPotentiallyFetchMoreFromFirestore && allFetchedSortedListings.value.length < currentDisplayCount.value);
    console.log(`DEBUG: hasNextPage computed: ${result} (currentDisplay: ${currentDisplayCount.value}, allFetched: ${allFetchedSortedListings.value.length}, canShowBuffer: ${canShowMoreFromBuffer}, canFetchFirestore: ${canPotentiallyFetchMoreFromFirestore})`);
    return result;
  });

  return {
    listings, // This is the reactive, capped list for the UI
    pending,
    error,
    loadMore,
    hasNextPage, // Use this computed for the "Load More" button visibility
  };
}