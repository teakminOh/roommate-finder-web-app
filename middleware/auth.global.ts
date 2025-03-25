import { getCurrentUser } from 'vuefire'

export default defineNuxtRouteMiddleware(async (to) => {
  const user = await getCurrentUser()
  
  // If user is authenticated and tries to access login page

  if (!user && (to.path === '/favorites')) {
    return navigateTo('/register')
  }
  // if(user && (to.path === '/profile/create')){
  //   return navigateTo('/')
  // }
}) 