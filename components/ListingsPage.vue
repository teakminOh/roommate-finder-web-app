<template>
  <div class = 'mx-20 mt-20'>

    <!-- Loading State -->
    <div v-if="pending && !listings.length" class="text-center py-10 text-gray-500">
      <p class="text-xl">Načítavam ponuky...</p>
    </div>

    <!-- Error State -->
    <!-- ... (error state as before) ... -->

    <!-- Listings Grid/List -->
    <div v-else-if="listings.length" class="flex items-center flex-wrap gap-6 justify-center">
       <div v-for="listing in listings" :key="`${listing.listingType}-${listing.id}`" 
          >
        <template v-if="listing.listingType === 'room'">
          <RoomItem :room="(listing as RoomListing).originalData" />
        </template>
        <template v-else-if="listing.listingType === 'roommateAd'">
          <RoommateItem :roommate="(listing as RoommateAdListing).originalData" />
        </template>
      </div>
    </div>

    <!-- No Results State -->
    <!-- ... (no results state as before) ... -->

    <!-- Load More Button -->
    <!-- hasNextPage from the composable is now canLoadMoreOverall -->
    <div v-if="hasNextPage && !pending" class="text-center mt-8"> <!-- Ensure listings might also be empty but still can load more initially -->
      <button
        @click="loadMoreListings"
        :disabled="pending"
        class="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
      >
        {{ pending ? 'Načítavam...' : 'Načítať ďalšie' }}
      </button>
    </div>
     <div v-if="pending && listings.length" class="text-center mt-8 text-gray-500">
        Načítavam ďalšie ponuky...
    </div>
  </div>
</template>

<script setup lang="ts">
import { useListings } from '~/composables/useListing'; // Or your actual path/name
import RoomItem from '~/components/rooms/RoomItem.vue';
import RoommateItem from '~/components/users/RoommateItem.vue';
import type { RoomListing, RoommateAdListing } from '~/types/listing';

const {
  listings,
  pending,
  error,
  loadMore: loadMoreListings,
  hasNextPage, // This is now `canLoadMoreOverall` from the composable
} = useListings();
</script>