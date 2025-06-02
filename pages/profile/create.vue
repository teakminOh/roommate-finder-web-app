<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 -mt-4">
    <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
      <div>
        <h1 class="text-center text-3xl font-extrabold text-gray-900">Vytvorte si účet</h1>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="signup">
        <!-- Email -->
        
        <!-- Location (with Google Places API integration suggestion) -->
        <div>
          <label for="location" class="block text-sm font-medium text-gray-700">
            Lokalita, kde chcete bývať
          </label>
          <div class="mt-1">
            <!-- For Google Places API integration, you might use a dedicated Vue component -->
            <LocationInput v-model="location" @location-changed="handleLocationChange" />
          </div>
        </div>

        <!-- Budget per Month -->
        <div>
          <label for="budget" class="block text-sm font-medium text-gray-700">Mesačný rozpočet (€)</label>
          <div class="mt-1">
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
        </div>

        <!-- Living Arrangement -->
        <div>
          <label for="livingArrangement" class="block text-sm font-medium text-gray-700">Typ bývania</label>
          <div class="mt-1">
            <select
              id="livingArrangement"
              v-model="livingArrangement"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Jednotlivec</option>
              <option>Pár</option>
              <option>Skupina priateľov</option>
            </select>
          </div>
        </div>

        <!-- Gender -->
        <div>
          <label for="gender" class="block text-sm font-medium text-gray-700">Pohlavie</label>
          <div class="mt-1">
            <select
              id="gender"
              v-model="gender"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Muž</option>
              <option>Žena</option>
              <option>Iné / Nechcem uviesť</option>
            </select>
          </div>
        </div>
         


        
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
          <div class="mt-1">
            <input
              id="email"
              v-model="email"
              type="email"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="vas@email.sk"
            />
          </div>
        </div>

        <!-- Password -->
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">Heslo</label>
          <div class="mt-1">
            <input
              id="password"
              v-model="password"
              type="password"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Minimálne 6 znakov"
            />
          </div>
        </div>

        <!-- Confirm Password -->
        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700">Potvrďte heslo</label>
          <div class="mt-1">
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Heslo znovu"
            />
          </div>
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
            {{ loading ? 'Registrácia...' : 'Registrovať sa' }}
          </button>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="rounded-md bg-red-50 p-4">
          <div class="flex">
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">Chyba pri registrácii</h3>
              <div class="mt-2 text-sm text-red-700">
                <p>{{ error }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Success Message for Verification Email -->
        <div v-if="verificationSent" class="rounded-md bg-green-50 p-4">
          <div class="flex">
            <div class="ml-3">
              <h3 class="text-sm font-medium text-green-800">Registrácia úspešná</h3>
              <div class="mt-2 text-sm text-green-700">
                <p>
                  Overovací email bol odoslaný na vašu adresu. Prosím, skontrolujte svoj email a kliknite na odkaz pre overenie.
                </p>
              </div>
            </div>
          </div>
        </div>

      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { createUserWithEmailAndPassword} from 'firebase/auth'
import { useFirebaseAuth, useFirestore } from 'vuefire'
import { FirebaseError } from 'firebase/app'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { GeoPoint } from 'firebase/firestore'



const db = useFirestore()
const auth = useFirebaseAuth()!

// Existing fields
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

// New fields for roommate matching profile
const location = ref('') 
const zip = ref('')         // Ideally, integrate Google Places Autocomplete here
const budget = ref<number | null>(null)
const livingArrangement = ref('')
const gender = ref('')



const agreedToTerms = ref(false)
const error = ref('')
const loading = ref(false)
const verificationSent = ref(false)

// Updated computed property to include new fiel

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
  verificationSent.value = false

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value)
    const user = userCredential.user
    await submitProfile(user.uid);

    navigateTo(`/profile/complete-profile/${user.uid}`)
   
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


async function submitProfile(uid: string) {
  loading.value = true
  error.value = ''
  success.value = false

  try {
    await setDoc(doc(db, 'users', uid), {
      email: email.value,
      location: location.value,
      zip: zip.value,
      coordinates: new GeoPoint(geo.value?.lat || 0, geo.value?.lng || 0),
      budget: budget.value,
      livingArrangement: livingArrangement.value,
      gender: gender.value,
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
