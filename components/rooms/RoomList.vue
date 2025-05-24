<template>
  <div >
    <!-- Use pending/error from composable -->
    <div v-if="pending && (!rooms || rooms.length === 0)" class="text-center text-gray-500 py-10"> <!-- Show loading if pending AND no rooms yet -->
      Načítavam izby...
    </div>
    <div v-else-if="error" class="text-center text-red-500 py-10">
       Chyba pri načítaní: {{ error.message }}
    </div>
    <div v-else-if="!rooms || rooms.length === 0" class="text-center text-gray-600 py-10">
        Nenašli sa žiadne izby zodpovedajúce filtrom.
    </div>

    <!-- Iterate over rooms from composable -->
    <div v-else id="list" class="flex items-center justify-center flex-wrap gap-6">
      <div v-for="room in rooms" :key="room.id" class="flex-none">
        <RoomItem :room="room" />
      </div>
    </div>

    <!-- Pagination Controls (use functions/state from composable) -->
    <div v-if="rooms && rooms.length > 0" class="flex items-center justify-center space-x-4 mt-8 mb-4">
      <button
        @click="loadPreviousPage"
        :disabled="currentPage === 1 || pending"
        class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Predchádzajúca
      </button>
      <span class="text-sm text-gray-600">Strana {{ currentPage }}</span>
      <button
        @click="loadNextPage"
        :disabled="!hasNextPage || pending"
        class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Nasledujúca
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, toRef, type Ref, watch } from 'vue'; // Added watch
import type { Room } from '~/types/room';
import RoomItem from './RoomItem.vue';
import type { Filters as FilterPayload } from '../RoomFilter.vue'; // Adjusted path if RoomFilter is in components/
import { useFilteredRooms } from '~/composables/useFilteredRooms';
import type { GeoPoint } from 'firebase/firestore';

// --- Props ---
const props = defineProps<{
  filters: Partial<FilterPayload>;
  centerGeoPoint: GeoPoint | null;
  searchRadiusKm: number;
  searchAddress: string | null; // Optional, for context
}>();

// --- Emits ---
const emit = defineEmits<{
  (e: 'rooms-updated', rooms: Room[]): void; // Event to send updated (filtered) rooms to parent
}>();

// --- Internal State for Pagination (Managed by RoomList for its instance of useFilteredRooms) ---
const listCurrentPage = ref(1);
const listPageStartCursors = ref<Record<number, unknown>>({ 1: null });
const listLoadPaginated = ref(true); // RoomList instance of useFilteredRooms needs pagination

// --- Use the Composable ---
const {
    rooms,          // This is the reactive list of rooms from the composable
    pending,
    error,
    currentPage,    // This is the reactive currentPage managed by the composable
    hasNextPage,
    loadNextPage,
    loadPreviousPage
} = useFilteredRooms(
    toRef(props, 'filters'),
    listLoadPaginated,
    listCurrentPage,
    listPageStartCursors,
    toRef(props, 'centerGeoPoint'), // No need for 'as Ref<...>' if types are good
    toRef(props, 'searchRadiusKm')  // No need for 'as Ref<...>'
);

// --- Watch the 'rooms' data from the composable ---
// When it changes (due to filters, geo-params, or pagination), emit an event to the parent.
watch(rooms, (newRoomsData) => {
  if (newRoomsData) { // newRoomsData will be the array of Room objects
    console.log("RoomList.vue: 'rooms' ref updated, emitting 'rooms-updated' with count:", newRoomsData.length);
    emit('rooms-updated', newRoomsData);
  } else {
    // Handle case where newRoomsData might be null or undefined if composable could return that
    console.log("RoomList.vue: 'rooms' ref updated to a falsy value, emitting empty array.");
    emit('rooms-updated', []);
  }
}, {
  immediate: true, // Emit the initial state once rooms are fetched (or if initially empty)
  deep: false      // Watching the ref itself is enough; `rooms` is a shallowRef of an array.
                   // If items within the array could change reactively and you needed to detect that,
                   // then deep: true would be for watching props.filters if it's a complex object.
                   // Here, we're watching the `rooms` ref provided by the composable.
});

</script>