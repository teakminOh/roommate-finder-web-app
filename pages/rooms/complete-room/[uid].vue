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
          <h2 class="text-xl font-bold mb-4">Detaily izby</h2>

          <!-- Preferred Gender -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Preferované pohlavie nájomcu</label>
            <div class="flex gap-2">
              <button
                v-for="gender in preferredGenders"
                :key="gender"
                type="button"
                @click="preferredGender = gender"
                :class="[
                  'px-4 py-2 rounded-lg border text-sm font-medium',
                  preferredGender === gender
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                ]"
              >
                {{ gender }}
              </button>
            </div>
          </div>

          <!-- Bathroom Type -->
          <div>
            <label for="bathroomType" class="block text-sm font-medium text-gray-700">Typ kúpeľne</label>
            <select
              id="bathroomType"
              v-model="bathroomType"
              required
              class="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option disabled value="">Vyberte možnosť</option>
              <option>Zdieľaná kúpeľňa</option>
              <option>Súkromná kúpeľňa</option>
            </select>
          </div>

          <!-- Room Features -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <label class="flex items-center space-x-2">
              <input type="checkbox" v-model="parkingAvailable" class="h-4 w-4 text-blue-600" />
              <span>🚙 Parkovanie</span>
            </label>
            <label class="flex items-center space-x-2">
              <input type="checkbox" v-model="internetIncluded" class="h-4 w-4 text-blue-600" />
              <span>🖥 Internet v cene</span>
            </label>
            <label class="flex items-center space-x-2">
              <input type="checkbox" v-model="isPrivateRoom" class="h-4 w-4 text-blue-600" />
              <span>☝️ Súkromná izba</span>
            </label>
            <label class="flex items-center space-x-2">
              <input type="checkbox" v-model="isFurnished" class="h-4 w-4 text-blue-600" />
              <span>🛏 Zariadené</span>
            </label>
            <label class="flex items-center space-x-2">
              <input type="checkbox" v-model="isAccessible" class="h-4 w-4 text-blue-600" />
              <span>♿ Bezbariérový prístup</span>
            </label>
          </div>
        </div>

        <!-- Tenant Preferences Step -->
        <div v-if="currentStep === 1" class="space-y-6">
          <h2 class="text-xl font-bold mb-4">Preferencie nájomcu</h2>

          <div class="space-y-4">
            <!-- Pets Allowed -->
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-700">🦴 Povolené domáce zvieratá</span>
              <label class="inline-flex items-center cursor-pointer">
                <input v-model="petsAllowed" type="checkbox" class="sr-only peer" />
                <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <!-- Sub-options shown only if petsAllowed is true -->
            <div v-if="petsAllowed" class="ml-2 mt-2 space-y-2">
              <label class="flex items-center space-x-2">
                <input type="checkbox" v-model="catFriendly" class="h-4 w-4 text-blue-600" />
                <span>🐱 Mačky povolené</span>
              </label>
              <label class="flex items-center space-x-2">
                <input type="checkbox" v-model="dogFriendly" class="h-4 w-4 text-blue-600" />
                <span>🐶 Psy povolené</span>
              </label>
            </div>

            <!-- Children Friendly -->
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-700">👶 Vhodné pre deti</span>
              <label class="inline-flex items-center cursor-pointer">
                <input v-model="childrenFriendly" type="checkbox" class="sr-only peer" />
                <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <!-- Students Welcome -->
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-700">🎓 Študenti vítaní</span>
              <label class="inline-flex items-center cursor-pointer">
                <input v-model="studentsWelcome" type="checkbox" class="sr-only peer" />
                <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        <!-- Property Description Step -->
        <div v-if="currentStep === 2" class="space-y-6">
          <h2 class="text-xl font-bold mb-4">Popis nehnuteľnosti a spolubývajúcich</h2>

          <!-- About the Property -->
          <div>
            <label for="aboutProperty" class="block text-sm font-medium text-gray-700">
              O nehnuteľnosti
            </label>
            <textarea
              id="aboutProperty"
              v-model="aboutProperty"
              rows="4"
              required
              class="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Povedzte nám, čo je skvelé na izbe, byte a lokalite..."
            ></textarea>
          </div>

          <!-- About the Roommates -->
          <div>
            <label for="aboutRoomies" class="block text-sm font-medium text-gray-700">
              O spolubývajúcich
            </label>
            <textarea
              id="aboutRoomies"
              v-model="aboutRoomies"
              rows="4"
              required
              class="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Povedzte nám niečo o sebe a ďalších ľuďoch, ktorí bývajú v byte..."
            ></textarea>
          </div>
        </div>

        <!-- Photo Upload Step -->
        <div v-if="currentStep === 3" class="space-y-6">
          <h2 class="text-xl font-bold mb-4">Fotky</h2>
          <p class="text-gray-600 mb-4">Nahrajte fotky vašej izby a nehnuteľnosti</p>
          <!-- FileUploader component would go here -->
          
            <FileUploader ref="fileUploader" />
          
        </div>

        <!-- Navigation Buttons -->
        <div class="flex justify-between mt-8 pt-6 border-t">
          <button 
            v-if="currentStep > 0" 
            type="button" 
            @click="prevStep" 
            class="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200"
          >
            ← Späť
          </button>
          
          <button 
            v-if="currentStep < steps.length - 1" 
            type="button" 
            @click="nextStep" 
            class="ml-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
          >
            Ďalej →
          </button>
          
          <button 
            v-if="currentStep === steps.length - 1" 
            type="submit" 
            :disabled="loading"
            class="ml-auto px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors duration-200"
          >
            {{ loading ? 'Ukladá sa...' : 'Uložiť profil' }}
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
import { useRoute } from 'vue-router'
import { ref } from 'vue'
import { doc, setDoc } from 'firebase/firestore'
import { useFirestore, getCurrentUser } from 'vuefire'
import FileUploader from '~/components/sell/FileUploader.vue'

const route = useRoute()
const user = await getCurrentUser()
const db = useFirestore()

// Use the UID from route params, or fall back to the current user's UID
const uid = route.params.uid as string || user?.uid

const steps = [
  'Základné info', 
  'Preferencie', 
  'Info', 
  'Fotky'
]

const preferredGender = ref('')
const bathroomType = ref('')
const parkingAvailable = ref(false)
const internetIncluded = ref(false)
const isPrivateRoom = ref(false)
const isFurnished = ref(false)
const isAccessible = ref(false)
const petsAllowed = ref(false)
const catFriendly = ref(false)
const dogFriendly = ref(false)
const childrenFriendly = ref(false)
const studentsWelcome = ref(false)
const aboutProperty = ref('')
const aboutRoomies = ref('')

const preferredGenders = [
  'Nezáleží',
  'Muž',
  'Žena' 
]

// Current step tracking
const currentStep = ref(0)
const fileUploader = ref<InstanceType<typeof FileUploader>>()

const loading = ref(false)
const success = ref(false)
const error = ref('')

// Navigation methods
const nextStep = () => {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

async function submitProfile() {
  if (!uid) {
    error.value = 'Chýba používateľské ID.'
    return
  }

  loading.value = true
  error.value = ''
  success.value = false

  try {
    // Submit profile data
    await fileUploader.value?.handleProcess()
    
    const uploadedUrls = fileUploader.value?.uploadedUrls || []
    await setDoc(doc(db, 'rooms', uid), {
      completedProfile: true,
      preferredGender: preferredGender.value,
      bathroomType: bathroomType.value,
      parkingAvailable: parkingAvailable.value,
      internetIncluded: internetIncluded.value,
      isPrivateRoom: isPrivateRoom.value,
      isFurnished: isFurnished.value,
      isAccessible: isAccessible.value,
      petsAllowed: petsAllowed.value,
      catFriendly: catFriendly.value,
      dogFriendly: dogFriendly.value,
      childrenFriendly: childrenFriendly.value,
      studentsWelcome: studentsWelcome.value,
      aboutProperty: aboutProperty.value,
      aboutRoomies: aboutRoomies.value,
      updatedAt: new Date(),
      images: uploadedUrls,
    }, { merge: true });

    success.value = true
    setTimeout(() => {
      navigateTo('/')
    }, 1500)
  } catch (err) {
    console.error(err)
    error.value = 'Nepodarilo sa uložiť profil.'
  } finally {
    loading.value = false
  }
}
</script>