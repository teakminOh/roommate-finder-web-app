<template>
  <div class="relative">
    <!-- Dropdown Trigger Button -->
    <button
      @click="isOpen = !isOpen"
      class="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      <span>Filtrovať Izby</span>
      <svg
        class="w-5 h-5 ml-2 -mr-1 transition-transform duration-200"
        :class="{ 'transform rotate-180': isOpen }"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg>
    </button>

    <!-- Dropdown Panel -->
    <div
      v-show="isOpen"
      class="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200"
    >
      <div class="p-4">
        <h3 class="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Filtrovať Izby</h3>
        <form @submit.prevent="applyFilters" class="space-y-4">

          <!-- Property Type -->
          <div>
            <label for="propertyType" class="block text-sm font-medium text-gray-700 mb-1">Typ Nehnuteľnosti</label>
            <select id="propertyType" v-model="filters.propertyType" class="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
              <option value="">Akýkoľvek</option>
              <option value="Byt">Byt</option>
              <option value="Radový dom">Radový dom</option>
              <option value="Apartmán">Apartmán</option>
              <option value="Rodinný dom">Rodinný dom</option>
              <option value="Bytový dom">Bytový dom</option>
              <option value="Suterén">Suterén</option>
              <option value="Podkrovie">Podkrovie</option>
              <option value="Garsónka">Garsónka</option>
              <!-- Add other property types as needed -->
            </select>
          </div>

          <!-- Budget -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="minBudget" class="block text-sm font-medium text-gray-700 mb-1">Min. Rozpočet (€)</label>
              <input type="number" id="minBudget" v-model.number="filters.minBudget" placeholder="0" min="0" class="w-full p-2 border border-gray-300 rounded-md shadow-sm">
            </div>
            <div>
              <label for="maxBudget" class="block text-sm font-medium text-gray-700 mb-1">Max. Rozpočet (€)</label>
              <input type="number" id="maxBudget" v-model.number="filters.maxBudget" placeholder="Nezáleží" min="0" class="w-full p-2 border border-gray-300 rounded-md shadow-sm">
            </div>
          </div>

           <!-- Room Type -->
          <div>
            <label for="roomType" class="block text-sm font-medium text-gray-700 mb-1">Typ bývania</label>
            <select id="roomType" v-model="filters.roomType" class="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
              <option value="">Akýkoľvek</option>
              <option value="Izba">Izba</option>
              <option value="Celý byt / dom">Celý byt / dom</option>
              <!-- Add other room types as needed -->
            </select>
          </div>

          <!-- Boolean Filters (Checkboxes) -->
          <div class="space-y-2 pt-2 border-t mt-4">
             <h4 class="text-sm font-medium text-gray-600 mb-2">Vlastnosti</h4>
             <div class="grid grid-cols-2 gap-x-4 gap-y-2">
                <label class="flex items-center space-x-2">
                  <input type="checkbox" v-model="filters.isFurnished" class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-offset-0 focus:ring-indigo-200 focus:ring-opacity-50">
                  <span class="text-sm text-gray-700">Zariadená</span>
                </label>
                <label class="flex items-center space-x-2">
                  <input type="checkbox" v-model="filters.parkingAvailable" class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-offset-0 focus:ring-indigo-200 focus:ring-opacity-50">
                  <span class="text-sm text-gray-700">Parkovanie</span>
                </label>
                <label class="flex items-center space-x-2"> <!-- childrenFriendly input -->
                  <input type="checkbox" v-model="filters.childrenFriendly" class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-offset-0 focus:ring-indigo-200 focus:ring-opacity-50">
                  <span class="text-sm text-gray-700">Vhodné pre deti</span>
                </label>
                <label class="flex items-center space-x-2">
                  <input type="checkbox" v-model="filters.petsAllowed" class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-offset-0 focus:ring-indigo-200 focus:ring-opacity-50">
                  <span class="text-sm text-gray-700">Domáce zvieratá</span>
                </label>
                 <label class="flex items-center space-x-2">
                  <input type="checkbox" v-model="filters.studentsWelcome" class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-offset-0 focus:ring-indigo-200 focus:ring-opacity-50">
                  <span class="text-sm text-gray-700">Študenti vítaní</span>
                </label>
                 <label class="flex items-center space-x-2">
                  <input type="checkbox" v-model="filters.internetIncluded" class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-offset-0 focus:ring-indigo-200 focus:ring-opacity-50">
                  <span class="text-sm text-gray-700">Internet v cene</span>
                </label>
                 <label class="flex items-center space-x-2">
                  <input type="checkbox" v-model="filters.isAccessible" class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-offset-0 focus:ring-indigo-200 focus:ring-opacity-50">
                  <span class="text-sm text-gray-700">Bezbariérový prístup</span>
                </label>
             </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" @click="resetFilters" class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Resetovať
            </button>
            <button type="submit" class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Použiť Filtre
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';

// Add state for dropdown toggle
const isOpen = ref(false);

// Define the structure of the filters
export interface Filters {
  propertyType: string;
  minBudget: number | null;
  maxBudget: number | null;
  roomType: string;
  isFurnished: boolean;
  parkingAvailable: boolean;
  childrenFriendly: boolean; // Definition is present
  petsAllowed: boolean;
  studentsWelcome: boolean;
  internetIncluded: boolean;
  isAccessible: boolean;
}

// Define emits for communication with parent
const emit = defineEmits<{
  (e: 'filters-changed', filters: Partial<Filters>): void
}>();

// Reactive object to hold filter values
const filters = reactive<Filters>({
  propertyType: '',
  minBudget: null,
  maxBudget: null,
  roomType: '',
  isFurnished: false,
  parkingAvailable: false,
  childrenFriendly: false, // Initialization is present
  petsAllowed: false,
  studentsWelcome: false,
  internetIncluded: false,
  isAccessible: false,
});

// Function to create a payload with only the *set* filters
const getActiveFiltersPayload = (): Partial<Filters> => {
  const payload: Partial<Filters> = {};
  if (filters.propertyType) payload.propertyType = filters.propertyType;
  if (filters.minBudget !== null && filters.minBudget >= 0) payload.minBudget = filters.minBudget;
  if (filters.maxBudget !== null && filters.maxBudget > 0) payload.maxBudget = filters.maxBudget;
  if (filters.roomType) payload.roomType = filters.roomType;

  // Only include boolean flags if they are checked (true)
  // Ordered to match Filters interface for consistency
  if (filters.isFurnished) payload.isFurnished = true;
  if (filters.parkingAvailable) payload.parkingAvailable = true;
  if (filters.childrenFriendly) payload.childrenFriendly = true; // Logic is present
  if (filters.petsAllowed) payload.petsAllowed = true;
  if (filters.studentsWelcome) payload.studentsWelcome = true;
  if (filters.internetIncluded) payload.internetIncluded = true;
  if (filters.isAccessible) payload.isAccessible = true;

  return payload;
}

// Method to apply filters and emit event
const applyFilters = () => {
  console.log("Applying filters (internal state):", JSON.parse(JSON.stringify(filters))); // Enhanced logging
  const activeFilters = getActiveFiltersPayload();
  console.log("Emitting active filters:", JSON.parse(JSON.stringify(activeFilters))); // Enhanced logging
  emit('filters-changed', activeFilters);
  isOpen.value = false;
};

// Method to reset filters to default and emit empty payload
const resetFilters = () => {
  filters.propertyType = '';
  filters.minBudget = null;
  filters.maxBudget = null;
  filters.roomType = '';

  // Ordered to match Filters interface for consistency
  filters.isFurnished = false;
  filters.parkingAvailable = false;
  filters.childrenFriendly = false; // Reset logic is present
  filters.petsAllowed = false;
  filters.studentsWelcome = false;
  filters.internetIncluded = false;
  filters.isAccessible = false;
  
  console.log("Filters reset. Emitting empty object."); // Logging for reset
  emit('filters-changed', {});
  isOpen.value = false; // Also close dropdown on reset
};
</script>

<style scoped>
/* Add any specific styles if needed */
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] {
  -moz-appearance: textfield; /* Firefox */
}
</style>