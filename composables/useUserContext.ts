// composables/useUserContext.ts
import { ref, watch, computed } from 'vue';
import { useCurrentUser, useFirestore, useDocument } from 'vuefire';
import { doc } from 'firebase/firestore';
import type { Room } from '~/types/room'; // Assuming your Room type

export function useUserContext() {
  const user = useCurrentUser(); // This is the Firebase Auth user
  const db = useFirestore();
  const isProcessingContext = ref(true); // To know when context is being determined

  // Reactive reference to the user's room document
  const userRoomDocRef = computed(() => {
    if (user.value?.uid) {
      return doc(db, 'rooms', user.value.uid);
    }
    return null;
  });

  // Fetch the room document (or check its existence)
  // This 'userRoom' is the data from the 'rooms' collection for the current user
  const { data: userRoom, pending: userRoomPending, promise: userRoomPromise } = useDocument<Room>(userRoomDocRef);

  const hasListedRoom = computed(() => !!userRoom.value); // True if userRoom.value is not null/undefined

  // Watch for changes in user or room data to update processing state
  watch([user, userRoomPending], ([currentUserAuth, roomPendingVal]) => {
    if (!currentUserAuth) {
      isProcessingContext.value = false; // Not processing if no user
      return;
    }
    isProcessingContext.value = roomPendingVal;
  }, { immediate: true });

  const recommendationsPath = computed(() => {
    if (!user.value) return '/matches'; // Default if not logged in or context unknown yet
    if (isProcessingContext.value) return '/matches'; // Default while loading context

    return hasListedRoom.value ? '/room-matches' : '/matches';
  });

  return {
    user,                     // The Firebase Auth user object (from useCurrentUser)
    userRoom,                 // <<< ADD THIS: The document data from 'rooms/{uid}'
    userRoomPending,          // <<< ADD THIS: Pending state for the userRoom document
    hasListedRoom,
    recommendationsPath,
    isProcessingContext
  };
}