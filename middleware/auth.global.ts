import { getCurrentUser, useFirestore, useDocument } from 'vuefire'
import { doc } from 'firebase/firestore'

export default defineNuxtRouteMiddleware(async (to) => {
  const user = await getCurrentUser()

  const protectedRoutes = ['/favorites', '/matches', '/room-matches', '/chats', '/dashboard']
  const signedIn = ['/rooms/create', 'profile/create']

  // Redirect to home if not authenticated
  if (!user && protectedRoutes.includes(to.path)) {
    return navigateTo('/')
  }

  if (user && signedIn.includes(to.path)) {
    return navigateTo('/')
  }
 
 
  const db = useFirestore()

  // Protect profile and room completion route based on UID and completion status
  if (to.path.startsWith('/profile/complete-profile/') || to.path.startsWith('/rooms/complete-room/')) {
    const uidParam = to.params.uid

    if (!user || user.uid !== uidParam) {
      return navigateTo('/')
    }

    const collectionName = to.path.startsWith('/profile/complete-profile/') ? 'users' : 'rooms'
    const docRef = doc(db, collectionName, uidParam)
    const docSnap = await useDocument(docRef)

    if (docSnap.value && docSnap.value.completedProfile) {
      return navigateTo('/')
    }
  }
})
