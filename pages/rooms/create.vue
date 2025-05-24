<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
      <div>
        <h1 class="text-center text-3xl font-extrabold text-gray-900">Pridať izbu na prenájom</h1>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="signup">
        <!-- Location -->
        <div>
          <label for="location" class="block text-sm font-medium text-gray-700">
            Lokalita nehnuteľnosti
          </label>
          <div class="mt-1">
            <LocationInput v-model="location" @location-changed="handleLocationChange" />
          </div>
        </div>

        <!-- Room Type -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Typ prenájmu</label>
          <div class="flex gap-2">
            <button
              v-for="type in roomTypes"
              :key="type"
              type="button"
              @click="roomType = type"
              :class="[
                'px-4 py-2 rounded-lg border text-sm font-medium',
                roomType === type
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              ]"
            >
              {{ type }}
            </button>
          </div>
        </div>


        <!-- Property Type -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Typ nehnuteľnosti</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="type in propertyTypes"
              :key="type"
              type="button"
              @click="propertyType = type"
              :class="[
                'px-3 py-2 rounded-lg border text-sm font-medium',
                propertyType === type
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              ]"
            >
              {{ type }}
            </button>
          </div>
        </div>


        <!-- Rent -->
        <div>
          <label for="budget" class="block text-sm font-medium text-gray-700">Nájom (€ / mesiac)</label>
          <input
            id="budget"
            v-model.number="budget"
            type="number"
            required
            min="50"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Napr. 400"
          />
        </div>

        <!-- Rent includes bills -->
        <div class="flex items-center mt-2">
          <input 
            id="rentWithBills"
            type="checkbox"
            v-model="rentWithBills"
            class="h-4 w-4 text-blue-600 focus:ring-blue-500"
          />
          <label for="rentWithBills" class="ml-2 text-sm text-gray-700">
            Zahŕňa energie a poplatky
          </label>
        </div>

        <!-- Security Deposit -->
        <div>
          <label for="securityDeposit" class="block text-sm font-medium text-gray-700">Vratná kaucia (€)</label>
          <input
            id="securityDeposit"
            v-model.number="securityDeposit"
            type="number"
            min="0"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Napr. 500"
          />
        </div>

        <!-- Available From -->
        <div>
          <label for="availableFrom" class="block text-sm font-medium text-gray-700">Dostupné od</label>
          <input
            id="availableFrom"
            v-model="availableFrom"
            type="date"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-gray-700">Tel. číslo</label>
          <input
            id="phoneNumber"
            v-model="phoneNumber"
            type="phoneNumber"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0908123456"
          />
        </div>

        <!-- Email -->
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="vas@email.sk"
          />
        </div>

        <!-- Password -->
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">Heslo</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Minimálne 6 znakov"
          />
        </div>

        <!-- Confirm Password -->
        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700">Potvrďte heslo</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Heslo znovu"
          />
        </div>

        <!-- Terms and Conditions -->
        <div class="flex items-center">
          <input 
            id="terms" 
            v-model="agreedToTerms" 
            type="checkbox" 
            required 
            class="h-4 w-4 text-blue-600 focus:ring-blue-500" 
          />
          <label for="terms" class="ml-2 block text-sm text-gray-900">
            Súhlasím s <a href="/terms" class="text-blue-500 hover:text-blue-700">podmienkami používania</a>
          </label>
        </div>

        <!-- Submit Button -->
        <div>
          <button
            type="submit"
            :disabled="loading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:bg-gray-400"
          >
            {{ loading ? 'Ukladám...' : 'Pridať izbu' }}
          </button>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="rounded-md bg-red-50 p-4">
          <div class="text-sm text-red-700">
            {{ error }}
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { useFirebaseAuth, useFirestore } from 'vuefire'
import { FirebaseError } from 'firebase/app'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { GeoPoint } from 'firebase/firestore'

const db = useFirestore()
const auth = useFirebaseAuth()!

const email = ref('')
const password = ref('')
const confirmPassword = ref('')

const location = ref('')
const zip = ref('')
const roomType = ref('')
const propertyType = ref('')
const budget = ref<number | null>(null)
const rentWithBills = ref(false)
const securityDeposit = ref<number | null>(null)
const availableFrom = ref('')
const phoneNumber = ref('')
const agreedToTerms = ref(false)
const error = ref('')
const loading = ref(false)

const geo = ref<{ lat: number; lng: number } | null>(null)

function handleLocationChange({
  address,
  zipCode,
  lat,
  lng,
}: {
  address: string
  zipCode: string
  lat: number
  lng: number
}) {
  location.value = address
  zip.value = zipCode
  geo.value = { lat, lng }
}
const success = ref(false)

const propertyTypes = [
  'Byt',
  'Bytový dom',
  'Rodinný dom',
  'Radový dom',
  'Suterén',
  'Podkrovie',
  'Garsónka',
  'Apartmán'
]

const roomTypes = [
  'Izba',
  'Celý byt / dom'
]


async function signup() {
  if (import.meta.server) return

  if (!auth) {
    error.value = 'Firebase autentifikácia nie je dostupná.'
    return
  }

  if (!location.value) {
    error.value= 'Vyplnte prosím lokalitu'
    return
  }
  if (password.value !== confirmPassword.value) {
    error.value = 'Heslá sa nezhodujú.'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value)
    const user = userCredential.user
    await submitProfile(user.uid)

    navigateTo(`/rooms/complete-room/${user.uid}`)
   
  } catch (err) {
    console.error(err)
    const errorObj = err as FirebaseError
    if (errorObj.code === 'auth/email-already-in-use') {
      error.value = 'Tento email je už zaregistrovaný.'
    } else if (errorObj.code === 'auth/invalid-email') {
      error.value = 'Nesprávny formát emailu.'
    } else if (errorObj.code === 'auth/weak-password') {
      error.value = 'Heslo musí mať aspoň 6 znakov.'
    } else {
      error.value = 'Chyba pri registrácii: ' + errorObj.message
    }
  } finally {
    loading.value = false
  }
}

async function submitProfile(uid: string) {
  loading.value = true
  error.value = ''
  success.value = false

  try {
    await setDoc(doc(db, 'rooms', uid), {
      email: email.value,
      location: location.value,
      zip: zip.value,
      coordinates: new GeoPoint(geo.value?.lat || 0, geo.value?.lng || 0),
      budget: budget.value,
      phoneNumber: phoneNumber.value,
      roomType: roomType.value,
      propertyType: propertyType.value,
      rentWithBills: rentWithBills.value,
      availableFrom: availableFrom.value,
      securityDeposit: securityDeposit.value,
      updatedAt: serverTimestamp(),
    }, { merge: true })

  } catch (err) {
    console.error(err)
    error.value = 'Nepodarilo sa uložiť profil.'
  } finally {
    loading.value = false
  }
}

</script>
