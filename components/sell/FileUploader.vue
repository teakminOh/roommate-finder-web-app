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

// Get Firebase storage instance
const storage = useFirebaseStorage()

// Emit event when upload completes
const emit = defineEmits(['uploadComplete'])
// Update the reactive files array when FilePond emits updatefiles event
function updateFiles(fileItems) {
  files.value = fileItems
}

async function handleProcess() {
  if (!files.value.length) {
    uploadError.value = 'Žiadne súbory vybrané'
    return
  }
  
  isUploading.value = true
  uploadError.value = null
  uploadedUrls.value = []

  try {
    for (const fileItem of files.value) {
      // FilePond might wrap the file in an object, so extract it
      const file = fileItem.file ? fileItem.file : fileItem
      const filename = `${Date.now()}_${file.name}`
      const fileRef = storageRef(storage, `images/${filename}`)
      
      await uploadBytes(fileRef, file)
      const url = await getDownloadURL(fileRef)
      uploadedUrls.value.push(url)
    }
    // Emit event for parent component if needed
    emit('uploadComplete', uploadedUrls.value)
  } catch (e) {
    uploadError.value = e.message || 'Nahrávanie zlyhalo'
    console.error('Upload failed:', e)
  } finally {
    isUploading.value = false
  }
}

// Expose functions and variables to parent
defineExpose({ handleProcess, uploadedUrls })
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
    <!-- Note: Removed the separate upload button so that parent controls when to upload -->
    <p v-if="uploadError" class="text-red-500">{{ uploadError }}</p>
  </div>
</template>
