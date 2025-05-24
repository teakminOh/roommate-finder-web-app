// composables/useUserContext.ts
import { ref, watch, computed } from 'vue';
import { useCurrentUser, useFirestore, useDocument } from 'vuefire';
import { doc } from 'firebase/firestore';
import type { Room } from '~/types/room'; // Assuming your Room type

export function useUserContext() {
  const user = useCurrentUser();
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
  const { data: userRoom, pending: userRoomPending, promise: userRoomPromise } = useDocument<Room>(userRoomDocRef);

  const hasListedRoom = computed(() => !!userRoom.value); // True if userRoom.value is not null/undefined

  // Watch for changes in user or room data to update processing state
  watch([user, userRoomPending], ([currentUser, roomPendingVal]) => {
    if (!currentUser) {
      isProcessingContext.value = false; // Not processing if no user
      return;
    }
    isProcessingContext.value = roomPendingVal;
  }, { immediate: true });

  // Await initial load if you need to block on it, otherwise computed is fine
  // onMounted(async () => {
  //   if (user.value) {
  //     await userRoomPromise.value; // Wait for the first fetch attempt
  //   }
  //   isProcessingContext.value = false;
  // });


  const recommendationsPath = computed(() => {
    if (!user.value) return '/matches'; // Default if not logged in or context unknown yet
    if (isProcessingContext.value) return '/matches'; // Default while loading context

    return hasListedRoom.value ? '/room-matches' : '/matches';
  });

  return {
    user,
    hasListedRoom,
    recommendationsPath,
    isProcessingContext // You can use this to show a loading state in the dropdown if needed
  };
}