<!-- components/SimplifiedProfileImageChanger.vue -->
<template>
  <div class="inline-block"> <!-- Or 'block' if you want it on its own line -->
    <button
      type="button"
      @click="triggerFileInput"
      :disabled="isUploading"
      :class="buttonClass"
      title="Zmeniť profilový obrázok"
    >
      <svg v-if="isUploading" class="animate-spin h-5 w-5" :class="iconClass" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <svg v-else :class="iconClass" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
      </svg>
    </button>

    <input
      ref="fileInput"
      type="file"
      accept="image/png, image/jpeg, image/gif, image/webp"
      class="hidden"
      @change="onFileSelectedAndUpload"
    />
    <!-- Error message (could be handled by parent via toast) -->
    <!-- <p v-if="errorMessage" class="text-xs text-red-600 mt-1 text-center">{{ errorMessage }}</p> -->
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useFirebaseStorage } from 'vuefire';
import { ref as storageRefFs, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'; // Renamed storageRef to avoid conflict

const props = defineProps({
  // currentImageUrl is still useful for knowing what to display if needed,
  // but not directly used for the button's display here.
  // currentImageUrl: { type: String, default: null },
  currentImagePath: { type: String, default: null }, // Path of the image to delete
  storagePath: { type: String, required: true },
  buttonClass: { type: String, default: 'p-2 bg-blue-100 rounded-full shadow hover:bg-blue-200' },
  iconClass: { type: String, default: 'w-4 h-4 text-blue-700' }
});

const emit = defineEmits(['image-update-confirmed', 'upload-error']);

const fileInput = ref(null);
const isUploading = ref(false);
// const errorMessage = ref(null); // Errors can be handled by parent via toast
const storage = useFirebaseStorage();

function triggerFileInput() {
  // errorMessage.value = null;
  fileInput.value?.click();
}

async function onFileSelectedAndUpload(event) {
  const file = event.target.files[0];
  if (!file) {
      resetFileInput();
      return;
  }

  const validTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    emit('upload-error', "Neplatný typ súboru (PNG, JPG, GIF, WEBP).");
    resetFileInput();
    return;
  }
  const maxSizeMB = 5;
  if (file.size > maxSizeMB * 1024 * 1024) {
    emit('upload-error', `Súbor je príliš veľký (Max ${maxSizeMB}MB).`);
    resetFileInput();
    return;
  }

  isUploading.value = true;
  // errorMessage.value = null;

  try {
    const uniquePrefix = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const newFilename = `${uniquePrefix}_${sanitizedFilename}`;
    const newFileRef = storageRefFs(storage, `${props.storagePath}/${newFilename}`); // Use renamed import

    await uploadBytes(newFileRef, file);
    const newUrl = await getDownloadURL(newFileRef);
    const newPath = newFileRef.fullPath;

    // Delete old image if path was provided
    if (props.currentImagePath) {
      try {
        await deleteObject(storageRefFs(storage, props.currentImagePath)); // Use renamed import
      } catch (deleteError) {
        console.warn("Failed to delete old image (might be expected):", deleteError.code);
      }
    }

    emit('image-update-confirmed', { url: newUrl, path: newPath });
  } catch (error) {
    console.error("Upload failed in changer:", error);
    emit('upload-error', error.message || "Nahrávanie zlyhalo.");
  } finally {
    isUploading.value = false;
    resetFileInput(); // Reset input so user can select same file again if needed
  }
}

function resetFileInput() {
    if (fileInput.value) {
        fileInput.value.value = '';
    }
}
</script>