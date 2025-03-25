<template>
  <div class="flex flex-col gap-4 max-w-2xl mx-auto">
    <h2 class="text-xl font-bold mb-4">Pridať inzerát</h2>
    <InzeratForm ref="inzeratForm" />
    <!-- FileUploader component -->
    <FileUploader ref="fileUploader" @upload-complete="handleUploadComplete" />
    <button 
      :disabled="isSaving" 
      @click="saveToMongoDB" 
      class="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 disabled:bg-gray-400 mt-4"
    >
      {{ isSaving ? 'Ukladá sa...' : 'Uložiť do MongoDB' }}
    </button>
    <p v-if="saveError" class="text-red-500 mt-2">{{ saveError }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import InzeratForm from './InzeratForm.vue'
import FileUploader from './FileUploader.vue'

const inzeratForm = ref(null)
const fileUploader = ref(null)
const urls = ref([])
const isSaving = ref(false)
const saveError = ref(null)

// Update URLs when FileUploader emits "uploadComplete"
function handleUploadComplete(uploadedUrls) {
  urls.value = uploadedUrls
}

async function saveToMongoDB() {
  // First, trigger the image upload by calling handleProcess on FileUploader.
  if (fileUploader.value && typeof fileUploader.value.handleProcess === 'function') {
    await fileUploader.value.handleProcess()
    // Optionally, update URLs (they can also be set via the emitted event)
    urls.value = fileUploader.value.uploadedUrls
  }
  
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.message}`)
    }
    const result = await response.json()
    console.log('MongoDB response:', result.message, 'ID:', result.id)

    navigateTo('/')
  } catch (e) {
    console.error('Failed to save to MongoDB:', e)
    saveError.value = 'Nepodarilo sa uložiť do MongoDB'
  } finally {
    isSaving.value = false
  }
}
</script>
