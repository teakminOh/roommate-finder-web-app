<template>
  <div class="room-image-manager">
    <file-pond
      ref="pond"
      name="room_images"
      label-idle="Sem presuňte obrázky alebo <span class='filepond--label-action'>prehľadávajte</span>"
      :allow-multiple="true"
      :allow-reorder="true"
      :files="filePondInitialFiles"
      :server="serverOptions"
      :accepted-file-types="['image/jpeg', 'image/png', 'image/webp', 'image/gif']"
      :max-files="maxFiles"
      :max-file-size="maxFileSize"
      credits="false"
      @init="handleFilePondInit"
      @processfile="handleFileProcess"
      @removefile="handleFileRemove"
      @reorderfiles="handleFilesReorder"
      @addfile="handleFileAdd"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import vueFilePond from 'vue-filepond';
import 'filepond/dist/filepond.min.css';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.min.css';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation';
import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size';
import * as FilePondLib from 'filepond';

import { useFirebaseStorage, useCurrentUser } from 'vuefire';
import { ref as storageRefFs, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { useToast } from 'vue-toastification';

const FilePond = vueFilePond(
  FilePondPluginFileValidateType,
  FilePondPluginImagePreview,
  FilePondPluginImageExifOrientation,
  FilePondPluginFileValidateSize
);

const FileStatus = FilePondLib.FileStatus;

const props = defineProps({
  initialImageUrls: { type: Array, default: () => [] },
  storagePath: { type: String, required: true },
  maxFiles: { type: Number, default: 10 },
  maxFileSize: { type: String, default: '2MB' },
});

const emit = defineEmits(['images-updated', 'upload-error', 'delete-error', 'delete-warning']);

const pond = ref(null);
const filePondInitialFiles = ref([]);

const storage = useFirebaseStorage();
const toast = useToast();
const user = useCurrentUser();

function getFilenameFromUrl(url) {
  try {
    const FsStorageUrl = new URL(url);
    const decodedPath = decodeURIComponent(FsStorageUrl.pathname);
    const storageObjectPrefix = `/v0/b/${storage.app.options.storageBucket}/o/`;
    let fullPathInStorage = '';

    if (decodedPath.startsWith(storageObjectPrefix)) {
      fullPathInStorage = decodedPath.substring(storageObjectPrefix.length);
    } else {
      console.warn("getFilenameFromUrl: URL does not match expected Firebase prefix:", url);
      const parts = decodedPath.split('/');
      fullPathInStorage = parts.slice(parts.indexOf('o') + 1).join('/');
    }
    
    if (props.storagePath && fullPathInStorage.startsWith(props.storagePath + '/')) {
      return fullPathInStorage.substring(props.storagePath.length + 1);
    } else if (!props.storagePath && fullPathInStorage) {
      return fullPathInStorage;
    }
    
    console.warn(`getFilenameFromUrl: Could not precisely extract filename using storagePath ("${props.storagePath}") from full path ("${fullPathInStorage}"). Using fallback.`);
    const parts = fullPathInStorage.split('/');
    return parts[parts.length - 1];

  } catch (e) {
    console.error("getFilenameFromUrl: Error parsing URL:", url, e);
    const lastSlash = url.lastIndexOf('/');
    const questionMark = url.indexOf('?');
    if (lastSlash !== -1) {
      return decodeURIComponent(url.substring(lastSlash + 1, questionMark !== -1 ? questionMark : undefined));
    }
    return null;
  }
}

onMounted(() => {
  filePondInitialFiles.value = props.initialImageUrls.map(url => ({
    source: url,
    options: {
      type: 'local',
      metadata: { originalUrl: url, uploaded: true }
    }
  }));
});

function handleFilePondInit() {
  console.log('FilePond initialized');
  updateParentWithCurrentFiles();
}

const serverOptions = computed(() => ({
  process: (fieldName, file, metadata, load, error, progress, abort) => {
    if (!user.value) { emit('upload-error', "Not authenticated"); error('Not authenticated'); return; }

    const uniquePrefix = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${uniquePrefix}_${sanitizedFilename}`;
    const fileRef = storageRefFs(storage, `${props.storagePath}/${filename}`);
    const uploadTask = uploadBytesResumable(fileRef, file);

    uploadTask.on(
      'state_changed',
      snapshot => progress(snapshot.bytesTransferred / snapshot.totalBytes),
      uploadError => {
        console.error("Upload error in process:", uploadError);
        toast.error(`Upload failed: ${uploadError.code}`);
        emit('upload-error', `Upload failed: ${uploadError.code}`);
        error('Upload failed');
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          load(downloadURL);
        } catch (getUrlError) {
          console.error("Error in getDownloadURL:", getUrlError);
          toast.error("Chyba pri získavaní URL obrázka.");
          emit('upload-error', "Chyba pri získavaní URL obrázka.");
          error('Failed to get URL');
        }
      }
    );
    return { abort: () => { uploadTask.cancel(); abort(); } };
  },
  revert: (uniqueFileId, load, error) => {
    const fileItem = pond.value?.getFiles().find(f => f.serverId === uniqueFileId || f.source === uniqueFileId);

    let storagePathToDelete = null;
    if (fileItem) {
      const filename = getFilenameFromUrl(uniqueFileId);
      if (filename) {
        storagePathToDelete = `${props.storagePath}/${filename}`;
      } else {
        const msg = `Nepodarilo sa odvodiť cestu k súboru pre odstránenie z URL: ${uniqueFileId}.`;
        toast.warning(msg);
        emit('delete-warning', msg);
        load(); updateParentWithCurrentFiles(); return;
      }
    }

    if (!storagePathToDelete) { load(); updateParentWithCurrentFiles(); return; }

    deleteObject(storageRefFs(storage, storagePathToDelete))
      .then(() => { toast.info("Obrázok odstránený zo servera."); load(); })
      .catch(deleteError => {
        console.error("Revert delete error:", deleteError);
        if (deleteError.code === 'storage/object-not-found') {
          toast.info("Súbor už neexistuje na serveri.");
        } else {
          toast.error("Nepodarilo sa odstrániť obrázok zo servera.");
          emit('delete-error', `Delete failed: ${deleteError.code}`);
        }
        load();
      });
  },
  load: (source, loadFn, errorFn) => {
    fetch(source)
      .then(res => res.blob())
      .then(blob => loadFn(blob))
      .catch(err => { console.error("Error loading initial file:", err); errorFn("Could not load image"); });
  }
}));

function handleFileAdd(error, file) {
  if (error) return;
  console.log('File added:', file.file.name);
}

function handleFileProcess(error, file) {
  if (error) return;
  updateParentWithCurrentFiles();
}

function handleFileRemove(error, file) {
  if (error) return;
  updateParentWithCurrentFiles();
}

function handleFilesReorder() {
  updateParentWithCurrentFiles();
}

function updateParentWithCurrentFiles() {
  if (!pond.value) return;
  const imageUrls = pond.value.getFiles()
    .filter(f =>
      (f.status === FileStatus.PROCESSING_COMPLETE && f.serverId) ||
      (f.options?.type === 'local' && f.source && ![FileStatus.PROCESSING_REVERTED, FileStatus.PROCESSING_ABORTED].includes(f.status)) ||
      (f.options?.type === 'limbo' && f.serverId)
    )
    .map(f => f.serverId || f.source);
  emit('images-updated', imageUrls);
}
</script>

<style>
/* ... your styles here ... */
</style>
