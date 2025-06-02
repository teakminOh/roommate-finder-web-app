<template>
  <div v-if="listing && editableListing" class="mt-4 space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-2xl font-bold text-blue-800 text-center flex-grow">
        <span>🏘️ Váš Inzerát</span>
      </h2>
    </div>
    <div class="flex justify-end mt-4">
        <button v-if="!isEditingDetails" @click="startDetailsEdit" class="bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-300 flex items-center">
          <span class="mr-2">✏️</span> Upraviť Detaily Inzerátu
        </button>
        <div v-else class="flex gap-2">
          <button
            @click="saveListingDetails"
            :disabled="isSavingDetails"
            class="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-300 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span class="mr-2">💾</span>
            {{ isSavingDetails ? 'Ukladám...' : 'Uložiť Detaily' }}
          </button>
          <button
            @click="cancelDetailsEdit"
            :disabled="isSavingDetails"
            class="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-300 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span class="mr-2">❌</span> Zrušiť
          </button>
        </div>
      </div>

    <!-- Enhanced Images Section (Display Mode) -->
    <div v-if="!isEditingDetails && currentDisplayImages && currentDisplayImages.length > 0" class="bg-white p-5 rounded-xl shadow-md border-l-4 border-teal-600 relative">
      <h3 class="text-lg font-semibold mb-3 text-teal-700 flex items-center">
        <span class="mr-2">🖼️</span> Obrázky Izby
      </h3>
      <div class="grid grid-cols-[2fr_1fr_1fr] grid-rows-2 gap-3 h-[300px] sm:h-[400px] md:h-[500px]">
        <div v-if="currentDisplayImages[0]" class="relative col-span-2 row-span-2 rounded-lg overflow-hidden cursor-pointer group" @click="openFullGallery(0)">
          <img :src="currentDisplayImages[0].url" alt="Hlavný obrázok izby" loading="lazy" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"/>
          <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-white opacity-75" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /> <circle cx="8.5" cy="8.5" r="1.5" /> <polyline points="21 15 16 10 5 21" /></svg>
          </div>
        </div>
        <div v-if="currentDisplayImages[1]" class="relative rounded-lg overflow-hidden cursor-pointer group" @click="openFullGallery(1)">
          <img :src="currentDisplayImages[1].url" alt="Obrázok izby 2" loading="lazy" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"/>
           <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-white opacity-75" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /> <circle cx="8.5" cy="8.5" r="1.5" /> <polyline points="21 15 16 10 5 21" /></svg>
          </div>
        </div>
        <div v-if="currentDisplayImages[2]" class="relative rounded-lg overflow-hidden cursor-pointer group" @click="openFullGallery(2)">
          <img :src="currentDisplayImages[2].url" alt="Obrázok izby 3" loading="lazy" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"/>
          <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-white opacity-75" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /> <circle cx="8.5" cy="8.5" r="1.5" /> <polyline points="21 15 16 10 5 21" /></svg>
          </div>
          <div v-if="currentDisplayImages.length > 3" class="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-semibold text-lg sm:text-xl cursor-pointer" @click.stop="openFullGallery(0)">
            +{{ currentDisplayImages.length - 3 }}
          </div>
        </div>
      </div>
      <div v-if="currentDisplayImages.length > 1" class="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-10">
        <button @click="openFullGallery(0)" class="bg-white/90 hover:bg-blue-100 text-blue-800 px-4 py-2 rounded-full flex items-center gap-2 shadow-md transition-all duration-200 text-xs sm:text-sm font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /> <circle cx="8.5" cy="8.5" r="1.5" /> <polyline points="21 15 16 10 5 21" /></svg>
          Všetky fotky ({{ currentDisplayImages.length }})
        </button>
      </div>
    </div>
    <div v-else-if="!isEditingDetails" class="bg-white p-5 rounded-xl shadow-md border-l-4 border-gray-400">
        <h3 class="text-lg font-semibold mb-2 text-gray-600 flex items-center"> <span class="mr-2">🖼️</span> Obrázky Izby </h3>
        <p class="text-sm text-gray-500">Žiadne obrázky neboli pridané k tomuto inzerátu.</p>
    </div>

    <!-- Image Manager for Editing -->
    <div v-if="isEditingDetails" class="bg-white p-5 rounded-xl shadow-md border-l-4 border-blue-600">
      <h3 class="text-lg font-semibold mb-3 text-blue-700 flex items-center">
        <span class="mr-2">🖼️</span> Spravovať Obrázky Izby
      </h3>
      <RoomImageManager
        :key="listing?.id || 'no-listing-image-manager'"
        :initial-image-urls="editableListing.images || []"
        storage-path="images"
        @images-updated="updateEditableImageUrls"
        @upload-error="(msg) => toast.error(msg)"
        @delete-error="(msg) => toast.error(msg)"
        @delete-warning="(msg) => toast.warning(msg)"
        :max-files="10"
        max-file-size="5MB"
      />
      <p class="text-xs text-gray-500 mt-2">Môžete pridať, odstrániť a zmeniť poradie obrázkov.</p>
    </div>

    <!-- Core Listing Details -->
    <div class="bg-white p-5 rounded-xl shadow-md border-l-4 border-teal-600">
      <h3 class="text-lg font-semibold mb-4 text-teal-700 flex items-center">
        <span class="mr-2">📋</span> Základné Detaily Inzerátu
      </h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        <!-- Typ Nehnuteľnosti -->
        <div class="transition-all duration-300 hover:bg-teal-50 p-3 rounded-lg flex-col items-start">
          <label class="block text-base font-bold text-teal-700">🏠 Typ Nehnuteľnosti</label>
          <div v-if="isEditingDetails" class="grid grid-cols-2 gap-2">
            <button
              v-for="type in propertyTypes"
              :key="type"
              type="button"
              @click="editableListing.propertyType = type"
              :class="[
                'px-3 py-2 rounded-lg border text-sm font-medium',
                editableListing.propertyType === type
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              ]"
            >
              {{ type }}
            </button>
          </div>
          <div v-else class="py-1 ml-8 text-sm font-medium text-gray-700">
            {{ editableListing.propertyType || 'Neuvedené' }}
          </div>
        </div>

        <template v-if="!isEditingDetails">
          <InfoItem icon="📍" label="Lokalita" :value="editableListing.location" />
        </template>
        <div v-else class="md:col-span-2">
          <strong class="text-teal-700 block mb-1">📍 Lokalita:</strong>
          <LocationInput
            v-model="editableListing.location"
            @location-changed="handleLocationDetailsChange"
            class="mt-1"
            placeholder="Zadajte adresu..."
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 md:col-span-2">
          <EditableInfoItem icon="💰" label="Nájom (€/mesiac)" v-model.number="editableListing.budget" :is-editing="isEditingDetails" inputType="number" />
          <EditableInfoItem icon="💡" label="Energie v cene" v-model="editableListing.rentWithBills" :is-editing="isEditingDetails" inputType="checkbox" />
          <EditableInfoItem icon="💸" label="Kaukcia (€)" v-model.number="editableListing.securityDeposit" :is-editing="isEditingDetails" inputType="number" :isOptional="true" />
          <EditableInfoItem icon="📅" label="Dostupné Od" v-model="editableListing.availableFrom" :is-editing="isEditingDetails" inputType="date" :formatter="formatDateForInput" :displayFormatter="(val) => val ? formatDate(val, true) : 'Ihneď / Flexibilné'" />
        </div>
        
        <!-- Typ Izby / Room Type -->
        <div class="transition-all duration-300 hover:bg-teal-50 p-3 rounded-lg flex-col items-start">
          <label class="block text-base font-bold text-teal-700">🚪 Typ Izby</label>
          <div v-if="isEditingDetails" class="flex flex-wrap gap-2">
            <button
              v-for="type in roomTypes"
              :key="type"
              type="button"
              @click="editableListing.roomType = type"
              :class="[
                'px-3 py-2 rounded-lg border text-sm font-medium',
                editableListing.roomType === type
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              ]"
            >
              {{ type }}
            </button>
          </div>
          <div v-else class="py-1 ml-8 text-sm font-medium text-gray-700">
            {{ editableListing.roomType || 'Neuvedené' }}
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 md:col-span-2">
          <EditableInfoItem icon="🔒" label="Súkromná Izba" v-model="editableListing.isPrivateRoom" :is-editing="isEditingDetails" inputType="checkbox" />
          <EditableInfoItem 
  icon="🛁" 
  label="Kúpeľňa" 
  v-model="editableListing.bathroomType" 
  :is-editing="isEditingDetails" 
  input-type="select"
  :options="['Súkromná kúpeľňa', 'Zdieľaná kúpeľňa']" 
/>
          <EditableInfoItem icon="🛋️" label="Zariadená" v-model="editableListing.isFurnished" :is-editing="isEditingDetails" inputType="checkbox" />
        </div>
      </div>
    </div>

    <!-- Descriptions -->
    <div class="bg-white p-5 rounded-xl shadow-md border-l-4 border-teal-600">
      <h3 class="text-lg font-semibold mb-4 text-teal-700 flex items-center">
        <span class="mr-2">📝</span> Popisy
      </h3>
      <div class="space-y-5">
        <div>
          <h4 class="font-medium text-gray-800 mb-2">O nehnuteľnosti:</h4>
           <EditableInfoItem :is-editing="isEditingDetails" inputType="textarea" v-model="editableListing.aboutProperty" :display-value="editableListing.aboutProperty || 'Popis nebol poskytnutý.'" />
        </div>
        <div>
          <h4 class="font-medium text-gray-800 mb-2">O spolubývajúcich (Ideálni / Aktuálni):</h4>
          <EditableInfoItem :is-editing="isEditingDetails" inputType="textarea" v-model="editableListing.aboutRoomies" :display-value="editableListing.aboutRoomies || 'Informácie neboli poskytnuté.'" />
        </div>
      </div>
    </div>

    <!-- Amenities & Rules -->
    <div class="bg-white p-5 rounded-xl shadow-md border-l-4 border-teal-600">
      <h3 class="text-lg font-semibold mb-4 text-teal-700 flex items-center">
        <span class="mr-2">🛠️</span> Vybavenie a Pravidlá
      </h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 mb-6">
        <EditableInfoItem icon="📶" label="Internet v cene" v-model="editableListing.internetIncluded" :is-editing="isEditingDetails" inputType="checkbox" />
        <EditableInfoItem icon="🅿️" label="Parkovanie" v-model="editableListing.parkingAvailable" :is-editing="isEditingDetails" inputType="checkbox" />
        <EditableInfoItem icon="♿" label="Bezbariérový prístup" v-model="editableListing.isAccessible" :is-editing="isEditingDetails" inputType="checkbox" />
        <EditableInfoItem icon="🐾" label="Domáce zvieratá povolené" v-model="editableListing.petsAllowed" :is-editing="isEditingDetails" inputType="checkbox" @update:modelValue="handlePetsAllowedChange" />
        <EditableInfoItem v-if="editableListing.petsAllowed || isEditingDetails" icon="🐕" label="Pes vítaný" v-model="editableListing.dogFriendly" :is-editing="isEditingDetails" inputType="checkbox" :disabled="!editableListing.petsAllowed && isEditingDetails" />
        <EditableInfoItem v-if="editableListing.petsAllowed || isEditingDetails" icon="🐈" label="Mačka vítaná" v-model="editableListing.catFriendly" :is-editing="isEditingDetails" inputType="checkbox" :disabled="!editableListing.petsAllowed && isEditingDetails" />
        <EditableInfoItem icon="👶" label="Deti vítané" v-model="editableListing.childrenFriendly" :is-editing="isEditingDetails" inputType="checkbox" />
        <EditableInfoItem icon="🧑‍🎓" label="Študenti vítaní" v-model="editableListing.studentsWelcome" :is-editing="isEditingDetails" inputType="checkbox" />
        <div class="transition-all duration-300 hover:bg-teal-50 p-3 rounded-lg flex-col items-start">
          <label class=" block text-base font-bold text-teal-700">🚻 Preferované Pohlavie</label>
          <div v-if="isEditingDetails" class="flex flex-wrap gap-2">
            <button
              v-for="gender in preferredGenders"
              :key="gender"
              type="button"
              @click="editableListing.preferredGender = gender"
              :class="[
                'px-3 py-2 rounded-lg border text-sm font-medium',
                editableListing.preferredGender === gender
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              ]"
            >
              {{ gender }}
            </button>
          </div>
          <div v-else class="py-1 ml-8 text-sm font-medium text-gray-700">
            {{ editableListing.preferredGender || 'Bez preferencie' }}
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white p-5 rounded-xl shadow-md border-l-4 border-teal-600">
      <h3 class="text-lg font-semibold mb-4 text-teal-700 flex items-center">
        <span class="mr-2">📞</span> Kontakt
      </h3>
        <div class="space-y-4">
          <EditableInfoItem icon="📧" label="Kontaktný Email" v-model="editableListing.email" :is-editing="isEditingDetails" inputType="email" />
          <EditableInfoItem icon="📞" label="Kontaktný Telefón" v-model="editableListing.phoneNumber" :is-editing="isEditingDetails" inputType="tel" :isOptional="true"/>
        </div>
    </div>

    <!-- Meta Information -->
    <div class="text-center space-y-1 py-2">
      <p v-if="listing && listing.id" class="text-xs text-gray-500">ID Inzerátu: {{ listing.id }}</p>
      <p v-if="listing && listing.updatedAt && !isEditingDetails" class="text-xs text-gray-600">Inzerát naposledy aktualizovaný: {{ formatDate(listing.updatedAt) }}</p>
    </div>
  </div>
  <div v-else class="flex items-center justify-center p-10">
    <div class="text-gray-500 text-center">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700 mx-auto mb-3"></div>
      <p class="text-lg">⏳ Načítavajú sa údaje inzerátu...</p>
    </div>
  </div>
<Teleport to="body">
  <FullGallery
    v-if="showFullGalleryModal"
    :images="galleryImages"
    @close="showFullGalleryModal = false"
    :initial-index="galleryInitialIndex"
  />
</Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useToast } from 'vue-toastification';
import { formatDate } from '~/utils/formatters'; // Ensure this path is correct
import InfoItem from '../rooms/InfoItem.vue';         // Ensure this path is correct
import EditableInfoItem from '../EditableInfoItem.vue'; // Ensure this path is correct
import FullGallery from '../FullGallery.vue';       // Ensure this path is correct
import LocationInput from '~/components/LocationInput.vue'; // Ensure this path is correct
import RoomImageManager from '~/components/RoomImageManager.vue'; // Path to your new component

const props = defineProps({
  listing: {
    type: Object,
    required: false, // Changed to false to handle loading state
    default: null
  }
});

const emit = defineEmits(['update-listing-details']);
const toast = useToast();

const isEditingDetails = ref(false);
const editableListing = ref(null); // Will hold the deep copy of props.listing for editing
const isSavingDetails = ref(false);

const showFullGalleryModal = ref(false);
const galleryInitialIndex = ref(0);

// Available options for property types, room types, preferred gender
const propertyTypes = [
  'Byt', 'Bytový dom', 'Rodinný dom', 'Radový dom', 
  'Garsónka', 'Apartmán', 'Suterén', 'Podkrovie'
];
const roomTypes = [
  'Súkromná izba', 'Zdieľaná izba', 'Štúdio', 'Celý byt/dom'
];
const preferredGenders = [
  'Bez preferencie', 'Muž', 'Žena', 'Zmiešané'
];

const formatDateForInput = (dateStringOrTimestamp) => {
  if (!dateStringOrTimestamp) return '';
  const date = (typeof dateStringOrTimestamp?.toDate === 'function')
               ? dateStringOrTimestamp.toDate()
               : new Date(dateStringOrTimestamp);
  if (isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const createEditableCopy = (sourceListing) => {
  if (!sourceListing) return null;
  // Deep copy to avoid mutating the original prop
  const freshCopy = JSON.parse(JSON.stringify(sourceListing));
  
  if (freshCopy.availableFrom && typeof freshCopy.availableFrom.toDate === 'function') {
    freshCopy.availableFrom = formatDateForInput(freshCopy.availableFrom.toDate());
  } else if (freshCopy.availableFrom && typeof freshCopy.availableFrom === 'string') {
    const d = new Date(freshCopy.availableFrom);
    if (!isNaN(d.getTime())) {
        freshCopy.availableFrom = formatDateForInput(d);
    } else {
        freshCopy.availableFrom = null; 
    }
  } else {
    freshCopy.availableFrom = null; 
  }

  if (freshCopy.coordinates && (freshCopy.coordinates.latitude === undefined || freshCopy.coordinates.longitude === undefined)) {
      if (Array.isArray(freshCopy.coordinates) && freshCopy.coordinates.length === 2) {
           freshCopy.coordinates = { latitude: freshCopy.coordinates[0], longitude: freshCopy.coordinates[1]};
      } else if (freshCopy.coordinates.lat !== undefined && freshCopy.coordinates.lng !== undefined) {
          freshCopy.coordinates = { latitude: freshCopy.coordinates.lat, longitude: freshCopy.coordinates.lng};
      } else { 
          freshCopy.coordinates = null; 
      }
  } else if (!freshCopy.coordinates) { 
      freshCopy.coordinates = null; 
  }
  
  freshCopy.images = Array.isArray(freshCopy.images) ? freshCopy.images : [];
  delete freshCopy.imageStoragePaths;

  return freshCopy;
};

watch(() => props.listing, (newVal) => {
  editableListing.value = createEditableCopy(newVal);
}, { immediate: true, deep: true });


// Computed property for images shown in the display grid (when not editing)
const currentDisplayImages = computed(() => {
    const source = props.listing; 
    // console.log("currentDisplayImages using props.listing.images:", source ? JSON.stringify(source.images) : 'null source'); // DEBUG LOG
    if (!source?.images?.length) return [];
    return source.images.map(url => ({ url, width: 800, height: 600, alt: 'Obrázok inzerátu' }));
});

// Computed property for images passed to the FullGallery
const galleryImages = computed(() => {
    const sourceImages = isEditingDetails.value && editableListing.value 
                         ? editableListing.value.images 
                         : props.listing?.images;
    if (!sourceImages?.length) return [];
    return sourceImages.map(url => ({ url, width: 800, height: 600, alt: 'Obrázok inzerátu' }));
});


function openFullGallery(index = 0) {
  galleryInitialIndex.value = Math.max(0, Math.min(index, galleryImages.value.length - 1));
  showFullGalleryModal.value = true;
}

watch(() => props.listing?.id, () => { 
    showFullGalleryModal.value = false;
});


function handleLocationDetailsChange(locationData) {
  if (editableListing.value) {
    editableListing.value.location = locationData.address; 
    if (locationData.lat !== undefined && locationData.lng !== undefined) {
      editableListing.value.coordinates = { latitude: locationData.lat, longitude: locationData.lng };
    } else {
      editableListing.value.coordinates = null;
    }
  }
}

function handlePetsAllowedChange(newValue) {
    if (editableListing.value && !newValue) {
        editableListing.value.dogFriendly = false;
        editableListing.value.catFriendly = false;
    }
}

function startDetailsEdit() {
  if (props.listing) {
    editableListing.value = createEditableCopy(props.listing);
    // console.log("startDetailsEdit - editableListing.images AFTER copy:", editableListing.value ? JSON.stringify(editableListing.value.images) : 'null editableListing'); // DEBUG LOG
    isEditingDetails.value = true;
  }
}

function cancelDetailsEdit() {
  if (props.listing) {
    editableListing.value = createEditableCopy(props.listing);
  }
  isEditingDetails.value = false;
}

function updateEditableImageUrls(newUrls) {
  // console.log("updateEditableImageUrls - received newUrls:", JSON.stringify(newUrls)); // DEBUG LOG
  if (editableListing.value) {
    editableListing.value.images = [...newUrls];
    // console.log("updateEditableImageUrls - editableListing.images AFTER update:", JSON.stringify(editableListing.value.images)); // DEBUG LOG
  }
}

async function saveListingDetails() {
  if (!editableListing.value) {
    toast.error("Chyba: Údaje inzerátu nie sú k dispozícii.");
    return;
  }
  isSavingDetails.value = true;

  const dataToSave = JSON.parse(JSON.stringify(editableListing.value));
  // console.log("Saving images:", dataToSave ? JSON.stringify(dataToSave.images) : 'null dataToSave'); // DEBUG LOG
  
  delete dataToSave.zip;

  if (dataToSave.budget !== undefined) {
    dataToSave.budget = Number(dataToSave.budget) || null;
  }
  if (dataToSave.securityDeposit !== undefined) {
    dataToSave.securityDeposit = Number(dataToSave.securityDeposit) || null;
  }

  const booleanFields = [
    'rentWithBills', 'isPrivateRoom', 'isFurnished', 'internetIncluded',
    'parkingAvailable', 'isAccessible', 'petsAllowed', 'dogFriendly',
    'catFriendly', 'childrenFriendly', 'studentsWelcome'
  ];
  booleanFields.forEach(field => {
    dataToSave[field] = dataToSave[field] === true || String(dataToSave[field]).toLowerCase() === 'true';
  });

  if (dataToSave.coordinates && (dataToSave.coordinates.latitude === undefined || dataToSave.coordinates.longitude === undefined)) {
      dataToSave.coordinates = null;
  }
  
  emit('update-listing-details', {
    data: dataToSave, 
    onComplete: (success) => { 
      isSavingDetails.value = false; 
      if (success) {
        isEditingDetails.value = false; 
      }
    }
  });
}

watch(isEditingDetails, (newValue, oldValue) => {
  if (oldValue && !newValue && isSavingDetails.value) { 
    isSavingDetails.value = false; 
  }
});
</script>

<style scoped>
/* Optional styling enhancements for RoomListingDisplay */
</style>