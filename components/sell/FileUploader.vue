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
const compressionProgress = ref(0)
const isCompressing = ref(false)

// Get Firebase storage instance
const storage = useFirebaseStorage()

// Emit event when upload completes
const emit = defineEmits(['uploadComplete'])

// Update the reactive files array when FilePond emits updatefiles event
function updateFiles(fileItems) {
  files.value = fileItems
}

// Check WebP support
function supportsWebP() {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  return canvas.toDataURL('image/webp').startsWith('data:image/webp')
}

// Calculate optimal dimensions maintaining aspect ratio
function calculateOptimalDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
  const aspectRatio = originalWidth / originalHeight
  
  let width = originalWidth
  let height = originalHeight
  
  // Scale down if too wide
  if (width > maxWidth) {
    width = maxWidth
    height = width / aspectRatio
  }
  
  // Scale down if too tall
  if (height > maxHeight) {
    height = maxHeight
    width = height * aspectRatio
  }
  
  return { width: Math.round(width), height: Math.round(height) }
}

// Compress to target file size by adjusting quality
function compressToTargetSize(canvas, format, initialQuality, maxFileSize, resolve) {
  let quality = initialQuality
  let attempts = 0
  const maxAttempts = 5
  
  function tryCompress() {
    canvas.toBlob((blob) => {
      if (blob.size <= maxFileSize || attempts >= maxAttempts || quality <= 0.1) {
        resolve(blob)
      } else {
        // Reduce quality and try again
        quality -= 0.1
        attempts++
        tryCompress()
      }
    }, format, quality)
  }
  
  tryCompress()
}

// Enhanced compression function with multiple optimizations
function compressImage(file, options = {}) {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8,
    maxFileSize = 500000, // 500KB target
    format = supportsWebP() ? 'image/webp' : 'image/jpeg'
  } = options

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // Calculate optimal dimensions
      let { width, height } = calculateOptimalDimensions(
        img.width, 
        img.height, 
        maxWidth, 
        maxHeight
      )
      
      canvas.width = width
      canvas.height = height
      
      // Enable image smoothing for better quality
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height)
      
      // Try different quality levels to hit target file size
      compressToTargetSize(canvas, format, quality, maxFileSize, resolve)
    }
    
    img.src = URL.createObjectURL(file)
  })
}

// Alternative compression using OffscreenCanvas for better performance (if supported)
async function compressImageOffscreen(file, options = {}) {
  if (!window.OffscreenCanvas) {
    return compressImage(file, options) // Fallback
  }
  
  try {
    const bitmap = await createImageBitmap(file)
    const { width, height } = calculateOptimalDimensions(
      bitmap.width,
      bitmap.height,
      options.maxWidth || 1200,
      options.maxHeight || 1200
    )
    
    const canvas = new OffscreenCanvas(width, height)
    const ctx = canvas.getContext('2d')
    
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(bitmap, 0, 0, width, height)
    
    const blob = await canvas.convertToBlob({
      type: options.format || (supportsWebP() ? 'image/webp' : 'image/jpeg'),
      quality: options.quality || 0.8
    })
    
    return blob
  } catch (e) {
    // Fallback to regular compression
    return compressImage(file, options)
  }
}

// Smart compression options based on file characteristics
function getCompressionOptions(file) {
  const fileSizeMB = file.size / (1024 * 1024)
  
  // Aggressive compression for large files
  if (fileSizeMB > 5) {
    return {
      maxWidth: 1000,
      maxHeight: 1000,
      quality: 0.6,
      maxFileSize: 300000, // 300KB
      format: supportsWebP() ? 'image/webp' : 'image/jpeg'
    }
  }
  
  // Medium compression for medium files
  if (fileSizeMB > 2) {
    return {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.7,
      maxFileSize: 400000, // 400KB
      format: supportsWebP() ? 'image/webp' : 'image/jpeg'
    }
  }
  
  // Light compression for small files
  return {
    maxWidth: 1400,
    maxHeight: 1400,
    quality: 0.8,
    maxFileSize: 500000, // 500KB
    format: supportsWebP() ? 'image/webp' : 'image/jpeg'
  }
}

// Sanitize filename for Firebase
function sanitizeFilename(filename) {
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_')
}

// Get file extension based on format
function getFileExtension(format, originalName) {
  if (format === 'image/webp') return '.webp'
  if (format === 'image/jpeg') return '.jpg'
  if (format === 'image/png') return '.png'
  
  // Fallback to original extension
  const ext = originalName.split('.').pop()
  return ext ? `.${ext}` : '.jpg'
}

// Enhanced upload function with better compression logic
async function handleProcess() {
  if (!files.value.length) {
    uploadError.value = 'Žiadne súbory vybrané'
    return
  }
  
  isUploading.value = true
  isCompressing.value = true
  uploadError.value = null
  uploadedUrls.value = []
  uploadProgress.value = 0
  compressionProgress.value = 0

  try {
    // First compress all images
    const compressedFiles = []
    
    for (let i = 0; i < files.value.length; i++) {
      const fileItem = files.value[i]
      const file = fileItem.file ? fileItem.file : fileItem
      
      if (file.type.startsWith('image/')) {
        const compressionOptions = getCompressionOptions(file)
        const compressedFile = await compressImageOffscreen(file, compressionOptions)
        
        // Create new file with proper extension
        const newExtension = getFileExtension(compressionOptions.format, file.name)
        const baseName = file.name.split('.').slice(0, -1).join('.')
        const newFileName = `${baseName}${newExtension}`
        
        compressedFiles.push({
          file: compressedFile,
          originalName: newFileName,
          originalSize: file.size,
          compressedSize: compressedFile.size
        })
      } else {
        compressedFiles.push({
          file: file,
          originalName: file.name,
          originalSize: file.size,
          compressedSize: file.size
        })
      }
      
      compressionProgress.value = Math.round(((i + 1) / files.value.length) * 100)
    }
    
    isCompressing.value = false
    
    // Now upload compressed files in parallel
    const uploadPromises = compressedFiles.map(async (fileData, index) => {
      const filename = `${Date.now()}_${index}_${sanitizeFilename(fileData.originalName)}`
      const fileRef = storageRef(storage, `images/${filename}`)
      
      await uploadBytes(fileRef, fileData.file)
      const url = await getDownloadURL(fileRef)
      
      // Update progress
      uploadProgress.value = Math.round(((index + 1) / compressedFiles.length) * 100)
      
      return {
        url,
        originalSize: fileData.originalSize,
        compressedSize: fileData.compressedSize,
        compressionRatio: Math.round((1 - fileData.compressedSize / fileData.originalSize) * 100)
      }
    })

    const results = await Promise.all(uploadPromises)
    uploadedUrls.value = results.map(r => r.url)
    
    // Log compression stats
    const totalOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0)
    const totalCompressedSize = results.reduce((sum, r) => sum + r.compressedSize, 0)
    const overallCompression = Math.round((1 - totalCompressedSize / totalOriginalSize) * 100)
    
    console.log(`🎯 Compression Stats:
      Original: ${(totalOriginalSize / 1024 / 1024).toFixed(2)}MB
      Compressed: ${(totalCompressedSize / 1024 / 1024).toFixed(2)}MB
      Saved: ${overallCompression}%
      WebP Support: ${supportsWebP()}`)
    
    emit('uploadComplete', uploadedUrls.value)
  } catch (e) {
    uploadError.value = e.message || 'Nahrávanie zlyhalo'
    console.error('Upload failed:', e)
  } finally {
    isUploading.value = false
    isCompressing.value = false
    uploadProgress.value = 0
    compressionProgress.value = 0
  }
}

// Expose functions and variables to parent
defineExpose({ 
  handleProcess, 
  uploadedUrls, 
  isUploading, 
  uploadProgress,
  isCompressing,
  compressionProgress
})
</script>

<template>
  <div class="space-y-4">
    <FilePondComponent 
      :files="files"
      @updatefiles="updateFiles"
      :allowMultiple="true"
      :acceptedFileTypes="['image/png', 'image/jpeg', 'image/gif', 'image/webp']"
      label-idle='Pridajte fotky pre väčšiu šancu na úspech. <span class="filepond--label-action">Browse</span>' 
    />
    
    <!-- Compression Progress -->
    <div v-if="isCompressing" class="space-y-2">
      <div class="bg-gray-200 rounded-full h-2">
        <div 
          class="bg-green-600 h-2 rounded-full transition-all duration-300" 
          :style="{ width: compressionProgress + '%' }"
        ></div>
      </div>
      <div class="flex items-center space-x-2">
        <svg class="animate-spin h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text-sm text-green-600">Kompresujeme obrázky... {{ compressionProgress }}%</p>
      </div>
    </div>
    
    <!-- Upload Progress -->
    <div v-if="isUploading && !isCompressing" class="space-y-2">
      <div class="bg-gray-200 rounded-full h-2">
        <div 
          class="bg-blue-600 h-2 rounded-full transition-all duration-300" 
          :style="{ width: uploadProgress + '%' }"
        ></div>
      </div>
      <div class="flex items-center space-x-2">
        <svg class="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text-sm text-blue-600">Nahrávame... {{ uploadProgress }}%</p>
      </div>
    </div>
    
    <!-- Error message -->
    <div v-if="uploadError" class="bg-red-50 border border-red-200 rounded-lg p-3">
      <div class="flex items-center space-x-2">
        <svg class="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-sm text-red-700">{{ uploadError }}</p>
      </div>
    </div>
    
    <!-- WebP Support indicator (optional, for debugging) -->
    <div v-if="supportsWebP()" class="text-xs text-green-600 opacity-75">
      ✓ WebP podporované - lepšia kompresia
    </div>
  </div>
</template>

<style scoped>
/* Custom FilePond styling */
:deep(.filepond--root) {
  font-family: inherit;
}

:deep(.filepond--drop-label) {
  color: #6b7280;
}

:deep(.filepond--label-action) {
  color: #3b82f6;
  font-weight: 600;
}

:deep(.filepond--panel-root) {
  border-radius: 0.5rem;
  border: 2px dashed #d1d5db;
  transition: border-color 0.2s;
}

:deep(.filepond--panel-root:hover) {
  border-color: #3b82f6;
}
</style>