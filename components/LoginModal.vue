<template>
  <div v-if="showAuthModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-8 max-w-md w-11/12 relative">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Vitajte!</h1>
        <button
          @click="showAuthModal = false"
          class="text-gray-500 hover:text-gray-700 text-2xl leading-none p-1"
        >
          ×
        </button>
      </div>

      <div class="flex flex-col gap-4">
        <h2 class="text-xl font-medium">Prihlásiť sa</h2>

        <!-- Email/Password Form -->
        <div class="space-y-4">
          <form @submit.prevent="signInWithEmail()" class="space-y-3">
            <input
              v-model="email"
              type="email"
              placeholder="Email"
              class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              v-model="password"
              type="password"
              placeholder="Heslo"
              class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              class="w-full bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-600 disabled:bg-gray-400"
              :disabled="loading"
            >
              {{ loading ? 'Spracováva sa...' : 'Prihlásiť sa' }}
            </button>
          </form>

          <!-- Display Error Message -->
          <p v-if="error" class="text-red-500 text-sm text-center">{{ error }}</p>
        </div>

        <!-- Removed Google Sign-in Button and the surrounding div -->

        <!-- Registration Link -->
        <!-- Adjusted margin-top for this section if needed, as the Google button section is gone -->
        <div class="text-center mt-6 pt-4 border-t border-gray-200">
          <p class="text-gray-600">Vytvorte si účet <NuxtLink
            to="/rooms/create"
            class="text-blue-500 hover:text-blue-700 font-medium"
            @click="showAuthModal = false"
          >
          zadaním dostupnej izby
          </NuxtLink> alebo vytvorením  <NuxtLink
            to="/profile/create"
            class="text-blue-500 hover:text-blue-700 font-medium"
            @click="showAuthModal = false"
          >
          profilu s požiadavkou na izbu.
          </NuxtLink></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Removed signInWithPopup and GoogleAuthProvider
import { signInWithEmailAndPassword } from 'firebase/auth'
import { useFirebaseAuth } from 'vuefire'
import { FirebaseError } from 'firebase/app'

const showAuthModal = useAuthModal() // Assuming useAuthModal is defined elsewhere and provides a ref
const auth = useFirebaseAuth()!
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

// Removed signInWithGoogle function

async function signInWithEmail() {
  try {
    loading.value = true
    error.value = '' // Clear previous errors
    await signInWithEmailAndPassword(auth, email.value, password.value)
    showAuthModal.value = false
    window.location.reload() // Reload the page after successful login
  } catch (err) {
    const errorObj = err as FirebaseError
    if (errorObj.code === 'auth/user-not-found' || errorObj.code === 'auth/invalid-credential') { // 'auth/invalid-credential' is common for wrong email/password
      error.value = 'Používateľ neexistuje alebo nesprávne heslo.'
    } else if (errorObj.code === 'auth/wrong-password') { // This might be redundant with invalid-credential but kept for clarity if specific
      error.value = 'Nesprávne heslo.'
    } else if (errorObj.code === 'auth/invalid-email') {
      error.value = 'Neplatný formát emailovej adresy.'
    }
    else {
      error.value = 'Prihlásenie zlyhalo. Skúste znova.' // More generic fallback
      console.error("Firebase Auth Error:", errorObj.code, errorObj.message)
    }
  } finally {
    loading.value = false
  }
}
</script>