<template>
  <div class="max-w-3xl mx-auto px-4 py-8">
    <div class="bg-white shadow-md rounded-lg overflow-hidden">
      <!-- Progress Indicator -->
      <div class="bg-gray-100 px-6 py-4 border-b">
        <div class="flex items-center justify-between relative">
          <div
            v-for="(step, index) in steps"
            :key="index"
            class="flex flex-col items-center relative z-10"
            :class="{ 'flex-1': index < steps.length - 1 }"
          >
            <!-- Step Circle -->
            <div
              class="inline-flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 font-semibold"
              :class="{
                'bg-blue-600 text-white shadow-lg': currentStep === index,
                'bg-green-600 text-white': currentStep > index,
                'bg-gray-300 text-gray-600': currentStep < index
              }"
            >
              <span v-if="currentStep > index">✓</span>
              <span v-else>{{ index + 1 }}</span>
            </div>

            <!-- Step Label -->
            <div
              class="text-xs mt-2 font-medium transition-colors duration-300 text-center"
              :class="{
                'text-blue-600': currentStep === index,
                'text-green-600': currentStep > index,
                'text-gray-500': currentStep < index
              }"
            >
              {{ step }}
            </div>

            <!-- Connecting Line -->
            <div
              v-if="index < steps.length - 1"
              class="absolute top-5 left-full w-full h-0.5 transition-all duration-300 -z-10"
              :class="{
                'bg-green-600': currentStep > index,
                'bg-gray-300': currentStep <= index
              }"
              style="transform: translateX(-50%);"
            ></div>
          </div>
        </div>

        <!-- Current Step Indicator -->
        <div class="mt-4 text-center">
          <span class="text-sm text-gray-600">Krok {{ currentStep + 1 }} z {{ steps.length }}: </span>
          <span class="text-sm font-semibold text-blue-600">{{ steps[currentStep] }}</span>
        </div>
      </div>

      <!-- Profile Wizard Content -->
      <form @submit.prevent="submitProfile" class="p-6">
        <!-- Basic Information Step -->
        <div v-if="currentStep === 0" class="space-y-6">
          <h2 class="text-xl font-bold mb-4">Základné informácie</h2>
          
          <div>
            <label for="firstName" class="block text-sm font-medium text-gray-700">Krstné meno</label>
            <input
              id="firstName"
              v-model="firstName"
              type="text"
              min="18"
              max="120"
              required
              class="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label for="phoneNumber" class="block text-sm font-medium text-gray-700">Telefónne číslo</label>
            <input
              id="phoneNumber"
              v-model="phoneNumber"
              placeholder="0908071235"
              type="text"
              oninput="this.value = this.value.replace(/\D/g, '')"
              inputmode="numeric"
              class="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label for="preferredMoveDate" class="block text-sm font-medium text-gray-700">
              Kedy by si sa chcel nasťahovať?
            </label>
            <input
              id="preferredMoveDate"
              v-model="preferredMoveDate"
              type="date"
              :min="minMoveDate"
              :max="maxMoveDate"
              required
              class="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label for="age" class="block text-sm font-medium text-gray-700">Vek</label>
            <input
              id="age"
              v-model.number="age"
              type="number"
              min="18"
              max="120"
              required
              class="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label for="occupation" class="block text-sm font-medium text-gray-700">Povolanie</label>
            <input
              id="occupation"
              v-model="occupation"
              type="text"
              class="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label for="childrenStatus" class="block text-sm font-medium text-gray-700">Deti</label>
            <select
              id="childrenStatus"
              v-model="childrenStatus"
              required
              class="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option selected>Nemám deti</option>
              <option>Deti ma budú navštevovať</option>
              <option>Deti budú bývať so mnou</option>
            </select>
          </div>
        </div>

        <!-- Lifestyle Step -->
        <div v-if="currentStep === 1" class="space-y-6">
          <h2 class="text-xl font-bold mb-4">Životný štýl</h2>
          
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-700">Hľadám s kamarátmi</span>
              <label class="inline-flex items-center cursor-pointer">
                <input 
                  v-model="isGroup" 
                  type="checkbox" 
                  class="sr-only peer"
                >
                <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div v-if="isGroup" class="pl-6 space-y-3">
              <h3 class="text-sm font-medium text-gray-700">Členovia skupiny</h3>

              <div v-for="(member, index) in groupMembers" :key="index" class="flex items-center gap-2">
                <input
                  v-model="groupMembers[index]"
                  type="text"
                  placeholder="Meno člena skupiny"
                  class="flex-1 rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <button
                  type="button"
                  @click="removeGroupMember(index)"
                  class="text-red-600 hover:text-red-800"
                >
                  Odstrániť
                </button>
              </div>

              <button
                type="button"
                @click="addGroupMember"
                class="text-blue-600 hover:text-blue-800"
              >
                + Pridať člena
              </button>
            </div>
            
            <!-- Smoking Toggle -->
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-700">Som fajčiar</span>
              <label class="inline-flex items-center cursor-pointer">
                <input 
                  v-model="isSmoker" 
                  type="checkbox" 
                  class="sr-only peer"
                >
                <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <!-- Pets Toggle -->
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-700">Mám domáce zvieratá</span>
              <label class="inline-flex items-center cursor-pointer">
                <input 
                  v-model="hasPets" 
                  type="checkbox" 
                  class="sr-only peer"
                >
                <div class="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-500 peer-checked:after:translate-x-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>

            <!-- Conditional Pet Details -->
            <div v-if="hasPets" class="mt-4 space-y-2">
              <div class="flex items-center">
                <input
                  id="hasDog"
                  v-model="hasDog"
                  type="checkbox"
                  class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label for="hasDog" class="ml-2 text-sm text-gray-700">Pes 🐶</label>
              </div>
              <div class="flex items-center">
                <input
                  id="hasCat"
                  v-model="hasCat"
                  type="checkbox"
                  class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label for="hasCat" class="ml-2 text-sm text-gray-700">Mačka 🐱</label>
              </div>
            </div>

            

            <!-- Student Status -->
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-700">Som študent</span>
              <label class="inline-flex items-center cursor-pointer">
                <input 
                  v-model="student" 
                  type="checkbox" 
                  class="sr-only peer"
                >
                <div class="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-500 peer-checked:after:translate-x-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
            <div v-if="student" class="space-y-4">
            <!-- School Selection -->
            <div>
              <label class="block text-sm font-medium text-gray-700">Vyberte školu</label>
              <select 
                v-model="selectedSchool" 
                required 
                class="mt-1 w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option disabled value="">Vyberte školu</option>
                <option 
                  v-for="(faculties, school) in schools" 
                  :key="school" 
                  :value="school"
                >
                  {{ school }}
                </option>
              </select>
            </div>

            <!-- Faculty Selection -->
            <div v-if="selectedSchool">
              <label class="block text-sm font-medium text-gray-700">Vyberte fakultu</label>
              <select 
                v-model="selectedFaculty" 
                required
                class="mt-1 w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option disabled value="">Vyberte fakultu</option>
                <option 
                  v-for="faculty in schools[selectedSchool as keyof typeof schools]" 
                  :key="faculty" 
                  :value="faculty"
                >
                  {{ faculty }}
                </option>
              </select>
            </div>

            <!-- Study Program -->
            <div v-if="selectedFaculty">
              <label for="studyProgram" class="block text-sm font-medium text-gray-700">Odbor</label>
              <input
                id="studyProgram"
                v-model="studyProgram"
                type="text"
                required
                placeholder="Zadajte svoj odbor"
                class="mt-1 w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
          </div>
        </div>


        <!-- Living Preferences Step -->
        <div v-if="currentStep === 2" class="space-y-6">
          <h2 class="text-xl font-bold mb-4">Moje Bývanie</h2>
          
          <div class="grid md:grid-cols-2 gap-6">
            <!-- Sleep Patterns Card -->
            <div class="bg-white shadow-md rounded-lg p-6 border">
              <h3 class="text-lg font-semibold text-gray-700 mb-4">Spánkový rytmus</h3>
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <label class="text-sm text-gray-600">Čas spánku</label>
                  <input 
                    type="time" 
                    v-model="bedTime" 
                    class="rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div class="flex items-center justify-between">
                  <label class="text-sm text-gray-600">Čas vstávania</label>
                  <input 
                    type="time" 
                    v-model="wakeTime" 
                    class="rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label class="block text-sm text-gray-600 mb-2">Som skôr</label>
                  <select 
                    v-model="dayPreference" 
                    class="w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option>Ranné vtáča</option>
                    <option>Nočná sova</option>
                    <option>Niečo medzi</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Social & Lifestyle Card -->
            <div class="bg-white shadow-md rounded-lg p-6 border">
              <h3 class="text-lg font-semibold text-gray-700 mb-4">Spoločenský život</h3>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm text-gray-600 mb-2">Pozývanie hostí</label>
                  <select 
                    v-model="guestFrequency" 
                    class="w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option>Často</option>
                    <option>Občas</option>
                    <option>Takmer nikdy</option>
                  </select>
                </div>
                
                <div>
                  <label class="block text-sm text-gray-600 mb-2">Tolerancia hluku</label>
                  <select 
                    v-model="noiseTolerance" 
                    class="w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option>Vysoká</option>
                    <option>Stredná</option>
                    <option>Nízka</option>
                  </select>
                </div>
                
                <div>
                  <label class="block text-sm text-gray-600 mb-2">Práca/štúdium z domu</label>
                  <select 
                    v-model="workHome" 
                    class="w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option>Áno</option>
                    <option>Občas</option>
                    <option>Nie</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Habits & Preferences Card -->
            <div class="bg-white shadow-md rounded-lg p-6 border">
              <h3 class="text-lg font-semibold text-gray-700 mb-4">Moje návyky</h3>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm text-gray-600 mb-2">Čistota</label>
                  <select 
                    v-model="cleanlinessLevel" 
                    class="w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option>Vždy je po mne poriadok</option>
                    <option>Čistý v spoločných priestoroch</option>
                    <option>Bordelár</option>
                  </select>
                </div>
                
                <div>
                  <label class="block text-sm text-gray-600 mb-2">Frekvencia upratovania</label>
                  <select 
                    v-model="cleaningFrequency" 
                    class="w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option>Denne</option>
                    <option>Týždenne</option>
                    <option>Nie často</option>
                  </select>
                </div>
                
                <div>
                  <label class="block text-sm text-gray-600 mb-2">Konzumácia alkoholu</label>
                  <select 
                    v-model="alcoholUse" 
                    class="w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option>Pravidelne</option>
                    <option>Príležitostne</option>
                    <option>Vôbec</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Food & Roommate Preferences Card -->
            <div class="bg-white shadow-md rounded-lg p-6 border">
              <h3 class="text-lg font-semibold text-gray-700 mb-4">Jedlo a spolubývanie</h3>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm text-gray-600 mb-2">Varenie</label>
                  <select 
                    v-model="cookingFrequency" 
                    class="w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option>Áno, denne</option>
                    <option>Občas</option>
                    <option>Takmer vôbec</option>
                  </select>
                </div>
                
                <div>
                  <label class="block text-sm text-gray-600 mb-2">Stravovacie preferencie</label>
                  <select 
                    v-model="dietaryPreference" 
                    class="w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option>Všežravec</option>
                    <option>Vegetarián</option>
                    <option>Vegán</option>
                    <option>Špeciálne diéty / alergie</option>
                  </select>
                </div>
                
                <div>
                  <label class="block text-sm text-gray-600 mb-2">Preferované pohlavie spolubývajúceho</label>
                  <select 
                    v-model="preferredGender" 
                    class="w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option>Žiadna preferencia</option>
                    <option>Muž</option>
                    <option>Žena</option>
                  </select>
                </div>
                
                <div>
                  <label class="block text-sm text-gray-600 mb-2">Preferovaný vek spolubývajúcich</label>
                  <input 
                    type="text" 
                    v-model="preferredAgeRange" 
                    placeholder="napr. 20-30 rokov" 
                    class="w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Personal Bio Step -->
        <div v-if="currentStep === 3" class="space-y-6">
          <h2 class="text-xl font-bold mb-4">O mne</h2>
          
          <div>
            <label for="bio" class="block text-sm font-medium text-gray-700">Krátky popis</label>
            <textarea
              id="bio"
              v-model="bio"
              rows="4"
              required
              class="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Napíšte niečo o sebe..."
            ></textarea>
          </div>
          <FileUploader ref="fileUploader" />
        </div>
         <!-- Step Validation Error Message -->
         <div v-if="stepValidationError" class="text-red-600 text-sm mt-4 p-3 bg-red-50 border border-red-300 rounded-md">
          {{ stepValidationError }}
        </div>
        <!-- Navigation Buttons -->
        <div class="flex justify-between mt-6">
          <button 
            v-if="currentStep > 0" 
            type="button" 
            @click="prevStep" 
            class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Späť
          </button>
          
          <button 
            v-if="currentStep < steps.length - 1" 
            type="button" 
            @click="nextStep" 
            class="ml-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Ďalej
          </button>
          
          <button 
  v-if="currentStep === steps.length - 1" 
  type="submit" 
  :disabled="loading"
  @click="handleSubmit"
  :class="[
    'ml-auto px-4 py-2 rounded-md text-white',
    loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
  ]"
>
  Uložiť profil
</button>
        </div>
      </form>
    </div>

    <!-- Success/Error Messages -->
    <div v-if="success" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mt-6">
      Profil bol úspešne uložený! Presmerujeme vás...
    </div>
    
    <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-6">
      {{ error }}
    </div>
  </div>
</template>
<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router' // Added useRouter for navigateTo
import { ref, computed } from 'vue'
import { doc, setDoc } from 'firebase/firestore'
import { useFirestore, getCurrentUser } from 'vuefire'
import schools from '~/src/data/schools.json'
import FileUploader from '~/components/sell/FileUploader.vue'

const route = useRoute()
const router = useRouter() // Added for navigateTo
const user = await getCurrentUser()
const db = useFirestore()

const uid = route.params.uid as string || user?.uid

const steps = [
  'Základné info', 
  'Životný štýl', 
  'Bývanie', 
  'O mne'
]

const currentStep = ref(0)
const stepValidationError = ref(''); // For step-specific validation errors

const fileUploader = ref<InstanceType<typeof FileUploader>>()

const age = ref<number | null>(null)
const phoneNumber = ref(''); // Changed to string, initialized to empty
const occupation = ref('')
const firstName = ref('')
const isSmoker = ref(false)

const student = ref(false)
const selectedSchool = ref('')
const selectedFaculty = ref('')

const bedTime = ref('')
const wakeTime = ref('')
const dayPreference = ref('')
const guestFrequency = ref('')
const cleanlinessLevel = ref('')
const cleaningFrequency = ref('')
const cookingFrequency = ref('')
const dietaryPreference = ref('')
const noiseTolerance = ref('')
const workHome = ref('')
const alcoholUse = ref('')
const preferredGender = ref('')
const preferredAgeRange = ref('')

const hasDog = ref(false)
const hasCat = ref(false)
const hasPets = ref(false)
const hasOtherPets = ref(false) // This was in submitProfile but not in refs, added for consistency
const childrenStatus = ref('Nemám deti'); // Initialized with a default valid value

const bio = ref('')

const isGroup = ref(false)
const groupMembers = ref<string[]>([])

const studyProgram = ref('')

const preferredMoveDate = ref('')

const minMoveDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

const maxMoveDate = computed(() => {
  const nextYear = new Date()
  nextYear.setFullYear(nextYear.getFullYear() + 1)
  return nextYear.toISOString().split('T')[0]
})

const loading = ref(false)
const success = ref(false)
const error = ref('')


// Validation Functions
const validateStep0 = (): string => {
  if (!firstName.value.trim()) return "Krstné meno je povinné."; 
  if (!preferredMoveDate.value) return "Preferovaný dátum nasťahovania je povinný.";
  if (age.value === null) return "Vek je povinný.";
  if (age.value < 18 || age.value > 120) return "Vek musí byť medzi 18 a 120.";
  if (!childrenStatus.value) return "Výber statusu detí je povinný."; // Should always be filled due to initialization
  return ""; // No error
};

const validateStep1 = (): string => {
  if (student.value) {
    if (!selectedSchool.value) return "Výber školy je povinný, ak ste študent.";
    if (!selectedFaculty.value) return "Výber fakulty je povinný, ak ste študent.";
    if (!studyProgram.value.trim()) return "Odbor štúdia je povinný, ak ste študent.";
  }
  // No specific validation for group members or pets for *advancing* step
  return ""; // No error
};

// Step 2 (Moje Bývanie) does not have 'required' fields for advancing based on current HTML
// Step 3 (O Mne) - bio is required for submission, not for a "Next" button from this step

// Navigation methods
const nextStep = () => {
  stepValidationError.value = ''; // Clear previous errors

  let errorMessage = "";
  if (currentStep.value === 0) {
    errorMessage = validateStep0();
  } else if (currentStep.value === 1) {
    errorMessage = validateStep1();
  }
  // Add more else if blocks here for other steps if they get required fields for advancing

  if (errorMessage) {
    stepValidationError.value = errorMessage;
    return; // Stop advancement
  }

  if (currentStep.value < steps.length - 1) {
    currentStep.value++;
  }
}

const prevStep = () => {
  stepValidationError.value = ''; // Clear errors when going back
  if (currentStep.value > 0) {
    currentStep.value--;
  }
}

function addGroupMember() {
  groupMembers.value.push('')
}

function removeGroupMember(index: number) {
  groupMembers.value.splice(index, 1)
}

const handleSubmit = async () => {
  stepValidationError.value = ''; // Clear step validation errors
  error.value = ''; // Clear general submission errors

  // Final validation for the last step's required fields (if any not covered by browser)
  // For example, 'bio' is required. The `required` attribute on textarea will be caught by browser on `type="submit"`.
  // If you want to be extra sure or have complex validation before submit:
  if (currentStep.value === steps.length - 1) {
      if (!bio.value.trim()) {
          stepValidationError.value = "Krátky popis (O mne) je povinný.";
          return;
      }
      // You could also check fileUploader.value?.files.length if an image is mandatory
  }


  loading.value = true
  try {
    await submitProfile() // submitProfile already handles its own logic
  } catch (err) {
    // submitProfile sets its own error.value, so this catch might be redundant
    // unless submitProfile itself throws an error that it doesn't handle.
    console.error("Error in handleSubmit:", err)
    error.value = 'Vyskytla sa neočakávaná chyba pri odosielaní.';
  } finally {
    loading.value = false
  }
}

async function submitProfile() {
  if (!uid) {
    error.value = 'Chýba používateľské ID.'
    loading.value = false; // Ensure loading is false if we return early
    return
  }

  // Re-validate all required fields before final submission
  // This is a good practice even if individual steps are validated
  const step0Error = validateStep0();
  if (step0Error) {
      error.value = `Chyba v Základných informáciách: ${step0Error}`;
      currentStep.value = 0; // Optionally switch to the step with error
      loading.value = false;
      return;
  }
  const step1Error = validateStep1();
  if (step1Error) {
      error.value = `Chyba v Životnom štýle: ${step1Error}`;
      currentStep.value = 1; // Optionally switch to the step with error
      loading.value = false;
      return;
  }
  if (!bio.value.trim()) {
      error.value = "Krátky popis (O mne) je povinný.";
      currentStep.value = 3; // Optionally switch to the step with error
      loading.value = false;
      return;
  }


  loading.value = true
  error.value = ''
  success.value = false

  try {
    console.log('Starting image upload...')
    await fileUploader.value?.handleProcess()
    
    const uploadedUrls = fileUploader.value?.uploadedUrls || []
    console.log('Images uploaded successfully:', uploadedUrls.length)

    console.log('Saving profile to Firestore...')
    await setDoc(doc(db, 'users', uid), {
      firstName: firstName.value,
      age: age.value,
      phoneNumber: phoneNumber.value, // Stored as string, ensure backend handles it if number is needed
      preferredMoveDate: preferredMoveDate.value || null,
      occupation: occupation.value,
      isSmoker: isSmoker.value,
      hasPets: hasPets.value,
      hasDog: hasPets.value ? hasDog.value : false, // Only save pet details if hasPets is true
      hasCat: hasPets.value ? hasCat.value : false, // Only save pet details if hasPets is true
      hasOtherPets: hasPets.value ? hasOtherPets.value : false, // Only save pet details if hasPets is true
      bio: bio.value,
      childrenStatus: childrenStatus.value,
      isGroup: isGroup.value,
      groupMembers: isGroup.value ? groupMembers.value.filter(m => m.trim() !== '') : [],
      student: student.value,
      selectedSchool: student.value ? selectedSchool.value : '', // Only save student details if student is true
      selectedFaculty: student.value ? selectedFaculty.value : '', // Only save student details if student is true
      studyProgram: student.value ? studyProgram.value : '', // Only save student details if student is true
      bedTime: bedTime.value,
      wakeTime: wakeTime.value,
      dayPreference: dayPreference.value,
      guestFrequency: guestFrequency.value,
      cleanlinessLevel: cleanlinessLevel.value,
      cleaningFrequency: cleaningFrequency.value,
      cookingFrequency: cookingFrequency.value,
      dietaryPreference: dietaryPreference.value,
      noiseTolerance: noiseTolerance.value,
      workHome: workHome.value,
      alcoholUse: alcoholUse.value,
      preferredGender: preferredGender.value,
      preferredAgeRange: preferredAgeRange.value,
      images: uploadedUrls,
      completedProfile: true,
      updatedAt: new Date(),
    }, { merge: true });

    console.log('Profile saved successfully!')
    success.value = true
    
    setTimeout(() => {
      router.push('/') // Use router.push for navigation
    }, 1500)
  } catch (err) {
    console.error('Submit error:', err)
    error.value = 'Nepodarilo sa uložiť profil. Skontrolujte zadané údaje a skúste to znova.'
  } finally {
    loading.value = false
  }
}
</script>