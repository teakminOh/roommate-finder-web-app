import { getCurrentUser } from 'vuefire'

export default defineNuxtRouteMiddleware(async (to) => {
  const user = await getCurrentUser()
  
  // If user is authenticated and tries to access login page

  if (!user && (to.path === '/favorites' || to.path === '/matches' || to.path === '/room-matches' || to.path === '/chats' || to.path === '/dashboard')) {
    return navigateTo('/')
  }
}) 