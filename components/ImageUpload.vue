<template>
  <div>
    <input type="file" @change="file = $event.target.files[0]" />
    <button :disabled="isUploading" @click="uploadImage">
      {{ isUploading ? 'Uploading...' : 'Upload' }}
    </button>
    <p v-if="uploadError" class="text-red-500">{{ uploadError }}</p>
    <img v-if="url" :src="url" alt="Uploaded Image" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useFirebaseStorage } from 'vuefire';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

const storage = useFirebaseStorage();
const file = ref(null);
const filename = ref('');
const uploadError = ref(null);
const isUploading = ref(false);
const url = ref(null);

// Reactive Storage Reference
const storageFileRef = computed(() => {
  const path = filename.value ? `images/${filename.value}` : null;
  console.log('Storage ref path:', path);
  return path ? storageRef(storage, path) : null;
});

async function uploadImage() {
  if (!file.value) {
    uploadError.value = 'No file selected';
    return;
  }

  const blob = file.value;
  filename.value = `${Date.now()}_${blob.name}`;
  console.log('Starting upload for:', filename.value);
  isUploading.value = true;
  uploadError.value = null;

  try {
    if (!storageFileRef.value) {
      throw new Error('Storage reference not ready');
    }
    console.log('Uploading to:', storageFileRef.value.fullPath);
    // Upload the file directly with uploadBytes
    await uploadBytes(storageFileRef.value, blob);
    console.log('Upload completed');
    // Fetch the URL only after upload is confirmed
    url.value = await getDownloadURL(storageFileRef.value);
    console.log('Upload successful! URL:', url.value);

    if (url.value) {
      await saveImageUrlToMongoDB(url.value);
    } else {
      uploadError.value = 'Upload completed but no URL returned';
    }
  } catch (e) {
    console.error('Upload failed:', e);
    uploadError.value = e.message || 'Upload failed';
  } finally {
    isUploading.value = false;
  }
}

async function saveImageUrlToMongoDB(imageUrl) {
  try {
    const response = await fetch('/api/save-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: imageUrl }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const result = await response.json();
    console.log('MongoDB response:', result.message);
  } catch (e) {
    console.error('Failed to save to MongoDB:', e);
    uploadError.value = 'Failed to save URL to MongoDB';
  }
}
</script>