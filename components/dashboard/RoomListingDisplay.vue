<template>
  <!-- Use v-if to ensure listing data is actually passed -->
  <div v-if="listing" class="border p-4 rounded bg-white shadow-sm space-y-2">
     <h3 class="font-semibold text-lg">{{ listing.propertyType || 'Listing' }} in {{ listing.location || 'Unknown Location' }}</h3>
     <p v-if="listing.id"><strong>Listing ID:</strong> {{ listing.id }}</p>
     <p><strong>Location:</strong> {{ listing.location || 'N/A' }} (ZIP: {{ listing.zip || 'N/A' }})</p>
     <p><strong>Rent (incl. Bills? {{ listing.rentWithBills ? 'Yes' : 'No' }}):</strong> €{{ listing.budget || 'N/A' }} / month</p>
     <p v-if="listing.securityDeposit"><strong>Security Deposit:</strong> €{{ listing.securityDeposit }}</p>
     <p><strong>Available From:</strong> {{ listing.availableFrom ? formatDate(listing.availableFrom, true) : 'N/A' }}</p>
     <p><strong>Room Type:</strong> {{ listing.roomType }} ({{ listing.isPrivateRoom ? 'Private' : 'Shared' }})</p>
     <p><strong>Bathroom:</strong> {{ listing.bathroomType || 'N/A' }}</p>
     <p><strong>Furnished:</strong> {{ listing.isFurnished ? 'Yes' : 'No' }}</p>

     <!-- Descriptions -->
     <div class="pt-2">
         <h4 class="font-medium text-md">Description</h4>
         <p class="text-sm text-gray-700 whitespace-pre-wrap mt-1">{{ listing.aboutProperty || 'No description provided.' }}</p>
     </div>
      <div class="pt-2">
         <h4 class="font-medium text-md">About Roomies (Ideal / Current)</h4>
         <p class="text-sm text-gray-700 whitespace-pre-wrap mt-1">{{ listing.aboutRoomies || 'No information provided.' }}</p>
     </div>

     <!-- Amenities & Rules -->
      <div class="pt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
         <h4 class="font-medium text-md col-span-2 mb-1">Amenities & Rules</h4>
         <p><strong>Internet Included:</strong> {{ listing.internetIncluded ? 'Yes' : 'No' }}</p>
         <p><strong>Parking Available:</strong> {{ listing.parkingAvailable ? 'Yes' : 'No' }}</p>
         <p><strong>Accessible:</strong> {{ listing.isAccessible ? 'Yes' : 'No' }}</p>
         <p><strong>Pets Allowed:</strong> {{ listing.petsAllowed ? 'Yes' : 'No' }}</p>
         <p v-if="listing.petsAllowed"><strong>Dog Friendly:</strong> {{ listing.dogFriendly ? 'Yes' : 'No' }}</p>
         <p v-if="listing.petsAllowed"><strong>Cat Friendly:</strong> {{ listing.catFriendly ? 'Yes' : 'No' }}</p>
         <p><strong>Children Welcome:</strong> {{ listing.childrenFriendly ? 'Yes' : 'No' }}</p>
         <p><strong>Students Welcome:</strong> {{ listing.studentsWelcome ? 'Yes' : 'No' }}</p>
         <p><strong>Preferred Gender:</strong> {{ listing.preferredGender || 'N/A' }}</p>
         <p v-if="listing.email"><strong>Listing Contact Email:</strong> {{ listing.email }}</p>
      </div>

     <!-- Images -->
     <div v-if="listing.images && listing.images.length > 0" class="pt-2">
         <h4 class="font-medium text-md mb-1">Images</h4>
         <div class="flex flex-wrap gap-2">
             <img v-for="(imgUrl, index) in listing.images" :key="index"
                  :src="imgUrl" alt="Room image ${index + 1}"
                  class="w-32 h-32 object-cover rounded border">
         </div>
     </div>

      <!-- Meta -->
      <p v-if="listing.updatedAt" class="text-xs text-gray-500 pt-3">
         Listing last updated: {{ formatDate(listing.updatedAt) }}
      </p>
  </div>
  <div v-else class="text-gray-500">Loading listing data...</div>
</template>

<script setup>
import { Timestamp } from 'firebase/firestore';
import { formatDate } from '~/utils/formatters'; // Assuming you move formatDate

// Define props the component expects
defineProps({
  listing: {
    // Can use your Room interface here if imported project-wide
    type: Object,
    required: false, // Can be null/undefined while loading
    default: null
  }
});

// Note: formatDate is now imported, not passed as a prop
</script>