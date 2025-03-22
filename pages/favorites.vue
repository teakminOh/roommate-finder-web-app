<template>
  <div class="container mx-auto px-4 py-8 mt-16">
    <h1 class="text-3xl font-bold mb-6">Obľúbené inzeráty</h1>
    
    <div v-if="!user" class="text-center py-12">
      <p class="text-gray-600 mb-4">Prihláste sa, aby ste videli svoje obľúbené inzeráty</p>
      <button 
        @click="showAuthModal = true"
        class="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
      >
        Login
      </button>
    </div>

    <div v-else-if="favorites.length === 0" class="text-center py-12">
      <p class="text-gray-600">Žiadne uložené inzeráty</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <PropertyItem 
        v-for="favorite in favorites" 
        :key="favorite.property.title"
        :property="favorite.property"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCurrentUser } from 'vuefire'
import { useFavorites } from '~/composables/useFavorites'
import { useAuthModal } from '~/composables/useAuthModal'

definePageMeta({
  layout: 'onlynav'
})

const user = useCurrentUser()
const { favorites } = useFavorites()
const showAuthModal = useAuthModal()
</script> 