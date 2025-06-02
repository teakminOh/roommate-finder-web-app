<script setup>
import { ref } from 'vue'
import vueFilePond from 'vue-filepond'
import 'filepond/dist/filepond.min.css'
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css'
import FilePondPluginImagePreview from 'filepond-plugin-image-preview'
import { useFirebaseStorage } from 'vuefire'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import * as FilePond from 'filepond'

// Import the file validation plugin and register it
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type'
FilePond.registerPlugin(FilePondPluginFileValidateType)

// Create a FilePond component instance with the image preview plugin
const FilePondComponent = vueFilePond(FilePondPluginImagePreview)

// Reactive variables
const files = ref([])
const isUploading = ref(false)
const uploadError = ref(null)
const uploadedUrls = ref([])
const uploadProgress = ref(0)

// Get Firebase storage instance
const storage = useFirebaseStorage()

// Emit event when upload completes
const emit = defineEmits(['uploadComplete'])

// Update the reactive files array when FilePond emits updatefiles event
function updateFiles(fileItems) {
  files.value = fileItems
}

// Compress image before upload
function compressImage(file, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
      canvas.width = img.width * ratio
      canvas.height = img.height * ratio
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(resolve, 'image/jpeg', quality)
    }
    
    img.src = URL.createObjectURL(file)
  })
}

async function handleProcess() {
  if (!files.value.length) {
    uploadError.value = 'Žiadne súbory vybrané'
    return
  }
  
  isUploading.value = true
  uploadError.value = null
  uploadedUrls.value = []
  uploadProgress.value = 0

  try {
    // ✅ FAST - Parallel uploads with compression
    const uploadPromises = files.value.map(async (fileItem, index) => {
      const file = fileItem.file ? fileItem.file : fileItem
      
      // Compress image if it's large
      const compressedFile = file.size > 1000000 ? await compressImage(file) : file
      
      const filename = `${Date.now()}_${index}_${file.name}`
      const fileRef = storageRef(storage, `images/${filename}`)
      
      await uploadBytes(fileRef, compressedFile)
      const url = await getDownloadURL(fileRef)
      
      // Update progress
      uploadProgress.value = Math.round(((index + 1) / files.value.length) * 100)
      
      return url
    })

    // Wait for all uploads to complete
    const urls = await Promise.all(uploadPromises)
    uploadedUrls.value = urls
    
    // Emit event for parent component if needed
    emit('uploadComplete', uploadedUrls.value)
  } catch (e) {
    uploadError.value = e.message || 'Nahrávanie zlyhalo'
    console.error('Upload failed:', e)
  } finally {
    isUploading.value = false
    uploadProgress.value = 0
  }
}

// Expose functions and variables to parent
defineExpose({ handleProcess, uploadedUrls, isUploading, uploadProgress })
</script>

<template>
  <div class="space-y-4">
    <FilePondComponent 
      :files="files"
      @updatefiles="updateFiles"
      :allowMultiple="true"
      :acceptedFileTypes="['image/png', 'image/jpeg', 'image/gif']"
      label-idle='Pridajte fotky pre väčšiu šancu na úspech. <span class="filepond--label-action">Browse</span>' 
    />
    
    <!-- Progress indicator -->
    <div v-if="isUploading" class="space-y-2">
      <div class="bg-gray-200 rounded-full h-2">
        <div 
          class="bg-blue-600 h-2 rounded-full transition-all duration-300" 
          :style="{ width: uploadProgress + '%' }"
        ></div>
      </div>
      <p class="text-sm text-gray-600">Nahrávanie... {{ uploadProgress }}%</p>
    </div>
    
    <p v-if="uploadError" class="text-red-500">{{ uploadError }}</p>
  </div>
</template>