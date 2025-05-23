export default defineNuxtConfig({
  compatibilityDate: '2025-01-15',
  devtools: { enabled: true },
  css: ['~/assets/main.scss',],
  runtimeConfig: {
    googleCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  },
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'stylesheet', href: 'https://www.gstatic.com/firebasejs/ui/6.1.0/firebase-ui-auth.css' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200' },
      ],
      script: [
        {
          src: `https://maps.googleapis.com/maps/api/js?key=${process.env.NUXT_GOOGLE_MAPS_API_KEY}&loading=async&libraries=places`,
          async: true, // Load the script asynchronously
          defer: true, // Defer script execution until the page has been parsed
        },
        {
          src: 'https://www.gstatic.com/firebasejs/ui/6.1.0/firebase-ui-auth.js'
        }
      ],
    },
  },
  ssr: false,
  modules: [
    'nuxt-vuefire',
  ],
  vuefire: {
    config: {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
    },
    auth: {
      enabled: true,
      sessionCookie: false,
    },
    db: {
      enabled: true,
      },
    storage: {
      enabled: true,
    } 
  },
})