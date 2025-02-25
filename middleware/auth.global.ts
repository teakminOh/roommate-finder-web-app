import { getCurrentUser } from 'vuefire'

export default defineNuxtRouteMiddleware(async (to) => {
  const user = await getCurrentUser()
  
  // If user is authenticated and tries to access login page
  if (user && (to.path === '/login' || to.path === '/signup')) {
    return navigateTo('/')
  }
}) 