<template>
  <div class="flex flex-col gap-4 max-w-2xl mx-auto">
    <h2 class="text-xl font-bold mb-4">Pridať inzerát</h2>
    <InzeratForm ref="inzeratForm" />
    <FileUploader ref="fileUploader" @upload-complete="handleUploadComplete" />
    <button 
      :disabled="isSaving || !urls.length" 
      @click="saveToMongoDB" 
      class="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 disabled:bg-gray-400 mt-4"
    >
      {{ isSaving ? 'Ukladá sa...' : 'Uložiť do MongoDB' }}
    </button>
    <p v-if="saveError" class="text-red-500 mt-2">{{ saveError }}</p>
    <ImageGallery :image-urls="urls" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import InzeratForm from './InzeratForm.vue'
import FileUploader from './FileUploader.vue'
import ImageGallery from './ImageGallery.vue' 

const inzeratForm = ref(null)
const fileUploader = ref(null)
const urls = ref([])
const saveError = ref(null)
const isSaving = ref(false)

function handleUploadComplete(uploadedUrls) {
  urls.value = uploadedUrls
}

async function saveToMongoDB() {
  if (!urls.value.length) {
    saveError.value = 'Najskôr nahrajte obrázky'
    return
  }

  isSaving.value = true
  saveError.value = null

  const data = {
    ...inzeratForm.value.form,
    images: urls.value,
    lastUpdated: Date.now(),
  }

  try {
    const response = await fetch('/api/save-inzerat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    const result = await response.json()
    console.log('MongoDB response:', result.message, 'ID:', result.id)
  } catch (e) {
    console.error('Failed to save to MongoDB:', e)
    saveError.value = 'Nepodarilo sa uložiť do MongoDB'
  } finally {
    isSaving.value = false
  }
}
</script>