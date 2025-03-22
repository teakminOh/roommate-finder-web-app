<template>
  <div class="space-y-4">
    <input 
      type="file" 
      multiple 
      @change="handleFileChange" 
      class="w-full"
    />
    <button 
      :disabled="isUploading || !files.length" 
      @click="uploadFiles" 
      class="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
    >
      {{ isUploading ? 'Nahráva sa...' : 'Nahrať obrázky' }}
    </button>
    <p v-if="uploadError" class="text-red-500">{{ uploadError }}</p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useFirebaseStorage } from 'vuefire'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'

const storage = useFirebaseStorage()
const files = ref([])
const isUploading = ref(false)
const uploadError = ref(null)
const urls = ref([])

const emit = defineEmits(['uploadComplete'])

function handleFileChange(event) {
  files.value = Array.from(event.target.files)
}

const storageFileRefs = computed(() => {
  return files.value.map(file => {
    const filename = `${Date.now()}_${file.name}`
    return { ref: storageRef(storage, `images/${filename}`), filename }
  })
})

async function uploadFiles() {
  if (!files.value.length) {
    uploadError.value = 'Žiadne súbory vybrané'
    return
  }

  isUploading.value = true
  uploadError.value = null
  urls.value = []

  try {
    const uploadPromises = storageFileRefs.value.map(async ({ ref, filename }) => {
      const blob = files.value.find(f => `${Date.now()}_${f.name}` === filename) || files.value[0]
      await uploadBytes(ref, blob)
      const url = await getDownloadURL(ref)
      return url
    })

    urls.value = await Promise.all(uploadPromises)
    emit('uploadComplete', urls.value)
  } catch (e) {
    uploadError.value = e.message || 'Nahrávanie zlyhalo'
    console.error('Upload failed:', e)
  } finally {
    isUploading.value = false
  }
}

defineExpose({ urls })
</script>