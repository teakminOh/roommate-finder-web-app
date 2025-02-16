<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-8 max-w-md w-11/12 relative">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Login</h1>
        <button 
          @click="closeModal" 
          class="text-gray-500 hover:text-gray-700 text-2xl leading-none p-1"
        >
          &times;
        </button>
      </div>
      
      <!-- Replace FirebaseUI with native buttons -->
      <div class="space-y-4">
        <button
          @click="signInWithGoogle"
          class="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50"
        >
          <img src="/public/images/google-icon.svg" alt="Google" class="w-6 h-6" />
          Continue with Google
        </button>
        
        <!-- Email/Password Form -->
        <form @submit.prevent="signInWithEmail" class="space-y-3">
          <input
            v-model="email"
            type="email"
            placeholder="Email"
            class="w-full px-3 py-2 border rounded-lg"
            required
          />
          <input
            v-model="password"
            type="password"
            placeholder="Password"
            class="w-full px-3 py-2 border rounded-lg"
            required
          />
          <button
            type="submit"
            class="w-full bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-600"
          >
            Sign in with Email
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword } from 'firebase/auth'
import { useFirebaseAuth } from 'vuefire'


const auth = useFirebaseAuth()!
const isOpen = ref(true)
const email = ref('')
const password = ref('')
const router = useRouter()

const closeModal = () => {
  isOpen.value = false
  navigateTo('/')
}

function signInWithGoogle() {
  signInWithPopup(auth, new GoogleAuthProvider()).then(() => router.replace('/'))
}

function signInWithEmail() {
  signInWithEmailAndPassword(auth, email.value, password.value).then(() => router.replace('/'))
}
</script>
