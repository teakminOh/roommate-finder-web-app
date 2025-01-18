export default defineNuxtConfig({
  compatibilityDate: '2025-01-15',
  devtools: { enabled: true },
  css: ['~/assets/main.scss',],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  app: {
    head: {
      script: [
        {
          src: `https://maps.googleapis.com/maps/api/js?key=${process.env.NUXT_GOOGLE_MAPS_API_KEY}&loading=async&libraries=places`,
          async: true, // Load the script asynchronously
          defer: true, // Defer script execution until the page has been parsed
        },
      ],
    },
  },
  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:3000', // Your API base URL
    },
  },
    
})