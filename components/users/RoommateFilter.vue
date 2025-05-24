<template>
  <div class="relative">
    <!-- Dropdown Trigger Button -->
    <button
      @click="isOpen = !isOpen"
      class="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      <span>Filtrovať Spolubývajúcich</span>
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
      class="absolute z-40 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200"
      style="max-height: 70vh; overflow-y: auto;"
    >
      <div class="p-4">
        <h3 class="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Filtrovať Spolubývajúcich</h3>
        <form @submit.prevent="applyFilters" class="space-y-4">

          <!-- Gender -->
          <div>
            <label for="roommateGender" class="block text-sm font-medium text-gray-700 mb-1">Pohlavie</label>
            <select id="roommateGender" v-model="filters.gender" class="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
              <option value="">Akýkoľvek</option>
              <option value="Muž">Muž</option>
              <option value="Žena">Žena</option>
            </select>
          </div>

          <!-- Age -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="roommateMinAge" class="block text-sm font-medium text-gray-700 mb-1">Min. Vek</label>
              <input type="number" id="roommateMinAge" v-model.number="filters.minAge" placeholder="18" min="16" class="w-full p-2 border border-gray-300 rounded-md shadow-sm">
            </div>
            <div>
              <label for="roommateMaxAge" class="block text-sm font-medium text-gray-700 mb-1">Max. Vek</label>
              <input type="number" id="roommateMaxAge" v-model.number="filters.maxAge" placeholder="Nezáleží" min="16" class="w-full p-2 border border-gray-300 rounded-md shadow-sm">
            </div>
          </div>

          <!-- Budget -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="roommateMinBudget" class="block text-sm font-medium text-gray-700 mb-1">Min. Rozpočet (€)</label>
              <input type="number" id="roommateMinBudget" v-model.number="filters.minBudget" placeholder="0" min="0" class="w-full p-2 border border-gray-300 rounded-md shadow-sm">
            </div>
            <div>
              <label for="roommateMaxBudget" class="block text-sm font-medium text-gray-700 mb-1">Max. Rozpočet (€)</label>
              <input type="number" id="roommateMaxBudget" v-model.number="filters.maxBudget" placeholder="Nezáleží" min="0" class="w-full p-2 border border-gray-300 rounded-md shadow-sm">
            </div>
          </div>

          <!-- Boolean-like Filters (Checkboxes with specific meanings) -->
          <div class="space-y-2 pt-2 border-t mt-4">
             <h4 class="text-sm font-medium text-gray-600 mb-2">Preferencie</h4>
             <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                <label class="flex items-center space-x-2">
                  <input type="checkbox" v-model="filters.wantsNonSmoker" class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-offset-0 focus:ring-indigo-200 focus:ring-opacity-50">
                  <span class="text-sm text-gray-700">Hľadám nefajčiara</span>
                </label>
                <label class="flex items-center space-x-2">
                  <input type="checkbox" v-model="filters.wantsNoPets" class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-offset-0 focus:ring-indigo-200 focus:ring-opacity-50">
                  <span class="text-sm text-gray-700">Preferujem bez zvierat</span>
                </label>
                 <label class="flex items-center space-x-2">
                  <input type="checkbox" v-model="filters.isStudent" class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-offset-0 focus:ring-indigo-200 focus:ring-opacity-50">
                  <span class="text-sm text-gray-700">Študent</span>
                </label>
             </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" @click="resetFilters" class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Resetovať
            </button>
            <button type="submit" class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-indigo-500">
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

const isOpen = ref(false);

// Define the structure of the filters for Roommates
// `isSmoker` and `hasPets` in the payload will be boolean.
// `wantsNonSmoker` and `wantsNoPets` are UI state for the checkboxes.
export interface FiltersState { // UI state for the form
  gender: string;
  minAge: number | null;
  maxAge: number | null;
  minBudget: number | null;
  maxBudget: number | null;
  wantsNonSmoker: boolean; // True if user checks "Hľadám nefajčiara"
  wantsNoPets: boolean;    // True if user checks "Preferujem bez zvierat"
  isStudent: boolean;      // True if user checks "Študent"
}

// This is the structure of the object that will be EMITTED
// It aligns with what the useFilteredRoommates composable expects for these fields
export interface EmittedFilters {
  gender?: string;
  minAge?: number | null;
  maxAge?: number | null;
  minBudget?: number | null;
  maxBudget?: number | null;
  isSmoker?: boolean;       // true (is a smoker), false (is not a smoker)
  hasPets?: boolean;        // true (has pets), false (does not have pets)
  student?: boolean;        // true (is a student)
}


const emit = defineEmits<{
  (e: 'filters-changed', filters: Partial<EmittedFilters>): void
}>();

// Reactive object for the form's V-MODELS
const filters = reactive<FiltersState>({
  gender: '',
  minAge: null,
  maxAge: null,
  minBudget: null,
  maxBudget: null,
  wantsNonSmoker: false,
  wantsNoPets: false,
  isStudent: false,
});

// Function to create a payload with only the *set* filters
const getActiveFiltersPayload = (): Partial<EmittedFilters> => {
  const payload: Partial<EmittedFilters> = {};

  if (filters.gender) {
    payload.gender = filters.gender;
  }

  if (filters.minAge !== null && filters.minAge >= 16) { // Assuming 16 is a reasonable minimum
    payload.minAge = filters.minAge;
  }
  if (filters.maxAge !== null && filters.maxAge >= 16) {
    if (filters.minAge !== null && filters.maxAge < filters.minAge) {
      // Optional: Handle invalid range, e.g., swap or clear maxAge
      payload.maxAge = filters.minAge; // Or show an error
    } else {
      payload.maxAge = filters.maxAge;
    }
  }


  if (filters.minBudget !== null && filters.minBudget >= 0) {
    payload.minBudget = filters.minBudget;
  }
  if (filters.maxBudget !== null && filters.maxBudget > 0) {
    if (filters.minBudget !== null && filters.maxBudget < filters.minBudget) {
        payload.maxBudget = filters.minBudget; // Or show an error
    } else {
        payload.maxBudget = filters.maxBudget;
    }
  }

  // Convert UI state to payload state
  if (filters.wantsNonSmoker) {
    payload.isSmoker = false; // If user wants non-smoker, query for isSmoker: false
  }
  // If you also wanted a "Wants Smoker" checkbox, you'd add:
  // else if (filters.wantsSmoker) { payload.isSmoker = true; }
  // If neither is checked, `isSmoker` is omitted (meaning "any" for smoker status)

  if (filters.wantsNoPets) {
    payload.hasPets = false; // If user wants no pets, query for hasPets: false
  }
  // If you also wanted a "Wants With Pets" checkbox, you'd add:
  // else if (filters.wantsWithPets) { payload.hasPets = true; }
  // If neither is checked, `hasPets` is omitted (meaning "any" for pet status)


  if (filters.isStudent) { // This is a direct mapping
    payload.student = true;
  }
  // If you wanted to filter for non-students:
  // else if (filters.isNotStudent) { payload.student = false; }


  return payload;
}

const applyFilters = () => {
  const activeFilters = getActiveFiltersPayload();
  console.log("Applying Roommate Filters (Emitting):", JSON.parse(JSON.stringify(activeFilters)));
  emit('filters-changed', activeFilters);
  isOpen.value = false;
};

const resetFilters = () => {
  filters.gender = '';
  filters.minAge = null;
  filters.maxAge = null;
  filters.minBudget = null;
  filters.maxBudget = null;
  filters.wantsNonSmoker = false;
  filters.wantsNoPets = false;
  filters.isStudent = false;

  console.log("Roommate Filters reset. Emitting empty object.");
  emit('filters-changed', {});
  isOpen.value = false;
};
</script>

<style scoped>
/* Styles remain the same */
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] {
  -moz-appearance: textfield;
}
</style>