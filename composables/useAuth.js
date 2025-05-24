// ~/composables/useAuth.js
import { getAuth, signOut as firebaseSignOut } from 'firebase/auth'
import { useState } from '#app'
import { navigateTo } from '#app'

export const useAuth = () => {
  const user = useState('user', () => null)

  const signOut = async () => {
    const auth = getAuth()
    await firebaseSignOut(auth)   // Firebase logout
    user.value = null             // reset your state
    navigateTo('/', { replace: true })
    window.location.reload()
  }

  return { user, signOut }
}
