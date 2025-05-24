<template>
  <div class="mt-6">
    <!-- Loading State: Show when pending and no roommates are yet loaded (initial load) -->
    <div v-if="pending && (!roommates || roommates.length === 0)" class="text-center text-gray-500 py-10">
      Načítavam spolubývajúcich...
      <!-- Optional: Add a spinner icon here -->
    </div>
    <!-- Error State -->
    <div v-else-if="error" class="text-center text-red-500 py-10">
       Chyba pri načítaní: {{ error.message }}
    </div>
    <!-- No Results State: Show when not pending, no error, but no roommates found -->
    <div v-else-if="!pending && (!roommates || roommates.length === 0)" class="text-center text-gray-600 py-10">
        Nenašli sa žiadni spolubývajúci zodpovedajúci filtrom.
    </div>

    <!-- Roommate List -->
    <div v-else id="list" class="flex flex-wrap justify-center items-center gap-6">
      <!-- Added justify-center for small screens, sm:justify-start for larger -->
      <div v-for="roommate in roommates" :key="roommate.id" class="flex-none">
        <RoommateItem :roommate="roommate" />
      </div>
    </div>

    <!-- Pagination Controls: Show only if there are roommates -->
    <div v-if="roommates && roommates.length > 0 && (currentPage > 1 || hasNextPage)" class="flex items-center justify-center space-x-4 mt-8 mb-4">
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
import { ref, watch, defineProps } from 'vue'; // Added defineProps
import { GeoPoint } from 'firebase/firestore'; // Import GeoPoint
import type { Roommate } from '~/types/user'; // Assuming this is your main Roommate type
import RoommateItem from './RoommateItem.vue';
import { useFilteredRoommates } from '~/composables/useFilteredRoommates';
// Assuming your RoommateFilter.vue exports its Filters interface
import type { EmittedFilters as RoommateBaseFilters } from './RoommateFilter.vue';


// --- Props for Filters and Geo Location ---
// This component will now expect filters and geo-location data to be passed to it,
// or it can define defaults if it's a top-level list without external filter controls.
interface Props {
  initialFilters?: Partial<RoommateBaseFilters>;
  centerGeoPoint?: GeoPoint | null;
  searchRadiusKm?: number;
}

const props = withDefaults(defineProps<Props>(), {
  initialFilters: () => ({}), // Default to empty filters
  centerGeoPoint: null,        // Default to no geo-filter
  searchRadiusKm: 0,           // Default to no geo-filter (radius 0 or less means inactive)
});


const emit = defineEmits<{ (e: 'roommates-updated', roommates: Roommate[]): void }>();

// Use props for filters
const activeFilters = ref<Partial<RoommateBaseFilters>>(props.initialFilters);
const searchCenter = ref<GeoPoint | null>(props.centerGeoPoint);
const searchRadius = ref<number>(props.searchRadiusKm);

// Watch for changes in props if filters/geo can be updated externally
watch(() => props.initialFilters, (newFilters) => {
  activeFilters.value = newFilters || {};
}, { deep: true });

watch(() => props.centerGeoPoint, (newCenter) => {
  searchCenter.value = newCenter;
});

watch(() => props.searchRadiusKm, (newRadius) => {
  searchRadius.value = newRadius || 0;
});


// Internal state for pagination cursors from the composable's perspective
const listCurrentPage = ref(1); // This ref will be managed by the composable for its UI page
const listPageCursors = ref<Record<number, unknown>>({ 1: null }); // Firestore cursors

// The `enablePagination` argument was removed from the composable in previous versions,
// as pagination is now inherent. If you had it for a specific reason, it would need to be re-added to the composable.

const {
  roommates,
  pending,
  error,
  currentPage, // This is the currentPageInternal from the composable
  hasNextPage,
  loadNextPage,
  loadPreviousPage
} = useFilteredRoommates(
  activeFilters,      // Pass the reactive filters
  listCurrentPage,    // Pass the ref for current page state
  listPageCursors,    // Pass the ref for Firestore cursors state
  searchCenter,       // Pass the reactive geo center
  searchRadius        // Pass the reactive search radius
);

watch(roommates, (newData) => {
  // Emit only the currently displayed (paginated) roommates
  emit('roommates-updated', newData || []);
}, { immediate: true, deep: true }); // deep: true if roommates array objects might change internally
</script>