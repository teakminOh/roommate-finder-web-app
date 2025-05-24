// components/Map.vue
<template>
  <ClientOnly>
    <div class="map-container w-full h-full relative">
      <div v-if="isInitializingMap || (firstLoad && props.roomsToDisplay.length === 0)" class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
        <span class="text-gray-600">Načítavam mapu a dáta...</span>
      </div>
      <div v-if="mapError" class="absolute inset-0 flex flex-col items-center justify-center bg-red-100 bg-opacity-90 z-10 p-4 text-center">
         <span class="text-red-700 text-sm">Chyba mapy: {{ mapError.message }}</span>
      </div>
      <div ref="mapDivRef" class="w-full h-full bg-gray-300">
         <div v-if="!mapInstance && !mapError && !isInitializingMap" class="flex items-center justify-center h-full text-gray-400 text-sm italic">
            Mapa sa inicializuje...
         </div>
      </div>
      
      <!-- RoomModal Component -->
      <RoomModal
        v-if="selectedRoom"
        :room="selectedRoom"
        :is-open="isModalOpen"
        @close="isModalOpen = false"
      />
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, shallowRef, computed, nextTick } from 'vue';
import type { Room } from '~/types/room';
import type { GeoPoint } from 'firebase/firestore';
import RoomModal from '~/components/rooms/RoomModal.vue';

/// <reference types="@types/google.maps" />

const props = defineProps<{
  apiKey: string;
  roomsToDisplay: Room[];
  centerGeoPoint: GeoPoint | null;
  searchRadiusKm: number;
  searchAddress: string | null;
}>();

const emit = defineEmits(['roomSelected']);

const currentMarkers = shallowRef<google.maps.Marker[]>([]);
const mapError = ref<Error | null>(null);
const isInitializingMap = ref(true);
const firstLoad = ref(true);

const mapInstance = ref<google.maps.Map | null>(null);
const mapDivRef = ref<HTMLElement | null>(null);
const searchCircle = ref<google.maps.Circle | null>(null);
const infoWindowInstance = shallowRef<google.maps.InfoWindow | null>(null);
const activeInfoWindowDomReadyListener = ref<google.maps.MapsEventListener | null>(null);

// Added for modal functionality
const isModalOpen = ref(false);
const selectedRoom = ref<Room | null>(null);

function openModal(room: Room) {
  selectedRoom.value = room;
  isModalOpen.value = true;
}

// Pomocná funkcia na skrátenie textu
function truncateText(text: string | undefined | null, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// Pomocná funkcia na vytvorenie obsahu pre InfoWindow v slovenčine
function createInfoWindowContent(room: Room): string {
  const images = room.images && room.images.length > 0 ? room.images : ['/images/placeholder.jpg']; // Uistite sa, že placeholder.jpg je v public/images
  const initialImageSrc = images[0];
  
  // Alt text pre obrázok v slovenčine
  const imageAltText = `Obrázok ${room.propertyType ? room.propertyType.toLowerCase() : 'nehnuteľnosti'}`;

  let content = `<div class="info-window-custom-content" style="width: 300px; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; line-height: 1.4;">`;

 
  // Sekcia s karuselom obrázkov
  content += `<div style="position: relative; margin-bottom: 10px; background-color: #e0e0e0; height: 180px; overflow: hidden; border-radius: 8px 8px 0 0; line-height: 0;">`;
  content += `<img id="infoWindowImage" src="${initialImageSrc}" alt="${imageAltText}" style="width: 100%; height: 180px; object-fit: cover; display: block;" />`;

  if (images.length > 1) {
  content += `
    <button id="infoWindowPrevBtn" aria-label="Predchádzajúci obrázok" style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.5); color: white; border: none; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; font-size: 20px; padding: 0;">
      <span style="position: absolute; top: 12px; left: 12px;">‹</span>
    </button>
    <button id="infoWindowNextBtn" aria-label="Nasledujúci obrázok" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.5); color: white; border: none; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; font-size: 20px; padding: 0;">
      <span style="position: absolute; top: 12px; left: 12px;">›</span>
    </button>
  `;
}
  content += `</div>`;
  // Sekcia s textovým obsahom
  content += `<div style="padding: 0 12px 12px 12px;">`;
  content += `<h3 style="margin: 0 0 6px; font-weight: 600; font-size: 1.05em; line-height: 1.3; color: #111827;">${room.location ? truncateText(room.location, 35) : (room.propertyType || 'Neznámy typ')}</h3>`;
  
  const priceToDisplay = room.budget;
  if (priceToDisplay) {
    content += `<div style="margin-bottom: 8px; font-size: 0.95em; color: #1D4ED8; font-weight: 600;">${priceToDisplay} € / mesiac</div>`;
  }

  content += `<div style="font-size: 0.85em; color: #4B5563; margin-bottom: 4px;">`;
  let line1Details = [];
  if (room.propertyType) line1Details.push(`🏠 ${room.propertyType}`);
  if (room.roomType) line1Details.push(room.roomType);
  
  if (line1Details.length > 0 || room.bathroomType) {
    content += `<div style="display: flex; justify-content: space-between; width: 100%; margin-bottom: 2px;">`;
    content += `<span>${line1Details.join(' - ')}</span>`;
    if (room.bathroomType) {
      content += `<span style="white-space: nowrap;">🚿 ${room.bathroomType}</span>`;
    }
    content += `</div>`;
  }
  content += `</div>`;

  if (room.availableFrom) {
    content += `<div style="font-size: 0.85em; color: #4B5563; margin-bottom: 8px;">📅 Voľné od: ${room.availableFrom}</div>`;
  }
  
  if (room.aboutProperty) {
    content += `<p style="font-size: 0.8em; color: #6B7280; margin-bottom: 10px; max-height: 3.6em; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;">${truncateText(room.aboutProperty, 90)}</p>`;
  }
  
  if (room.id) {
    // Changed from direct link to button that triggers modal
    content += `<div style="margin-top: 12px; text-align: right;">
      <button id="openModalBtn" data-room-id="${room.id}" style="color: #ffffff; background-color: #2563EB; text-decoration: none; font-size: 0.875em; padding: 8px 14px; border-radius: 6px; display: inline-block; font-weight: 500; transition: background-color 0.2s ease; border: none; cursor: pointer;">Viac detailov</button>
    </div>`;
  }
  content += `</div>`;
  content += `</div>`;

  return content;
}

const attachInfoWindowDomListeners = (iw: google.maps.InfoWindow, room: Room) => {
  if (activeInfoWindowDomReadyListener.value) {
    google.maps.event.removeListener(activeInfoWindowDomReadyListener.value);
    activeInfoWindowDomReadyListener.value = null;
  }

  activeInfoWindowDomReadyListener.value = google.maps.event.addListener(iw, 'domready', () => {
    const imgElement = document.getElementById('infoWindowImage') as HTMLImageElement | null;
    const prevBtn = document.getElementById('infoWindowPrevBtn') as HTMLButtonElement | null;
    const nextBtn = document.getElementById('infoWindowNextBtn') as HTMLButtonElement | null;
    const modalBtn = document.getElementById('openModalBtn') as HTMLButtonElement | null;

    const imagesFromRoom = room.images && room.images.length > 0 ? room.images : ['/images/placeholder.jpg'];
    
    if (imgElement) {
      imgElement.onerror = () => { 
        if (imgElement) imgElement.src = '/images/placeholder.jpg';
      };
      if (imgElement.src.includes('placeholder.jpg') && imagesFromRoom[0] !== '/images/placeholder.jpg') {
        imgElement.src = imagesFromRoom[0];
      }
    }

    // Add event listener for modal button
    if (modalBtn) {
      modalBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        selectedRoom.value = room;
        isModalOpen.value = true;
        if (infoWindowInstance.value) {
          infoWindowInstance.value.close();
        }
      });
    }

    if (imagesFromRoom.length > 1 && imgElement && prevBtn && nextBtn) {
      let currentIndex = imagesFromRoom.indexOf(imgElement.src);
      if (currentIndex === -1 || currentIndex >= imagesFromRoom.length) {
        currentIndex = 0; 
        imgElement.src = imagesFromRoom[currentIndex];
      }

      const updateImage = () => {
        if (imgElement) {
          const newImageSrc = imagesFromRoom[currentIndex];
          const tempImg = new Image();
          tempImg.onload = () => { imgElement.src = newImageSrc; };
          tempImg.onerror = () => { imgElement.src = '/images/placeholder.jpg'; };
          tempImg.src = newImageSrc;
        }
      };

      prevBtn.onclick = (e) => {
        e.stopPropagation();
        currentIndex = (currentIndex - 1 + imagesFromRoom.length) % imagesFromRoom.length;
        updateImage();
      };

      nextBtn.onclick = (e) => {
        e.stopPropagation();
        currentIndex = (currentIndex + 1) % imagesFromRoom.length;
        updateImage();
      };
      prevBtn.style.display = 'flex';
      nextBtn.style.display = 'flex';
    } else {
      if (prevBtn) prevBtn.style.display = 'none';
      if (nextBtn) nextBtn.style.display = 'none';
    }
  });
};

async function initializeMap() {
  isInitializingMap.value = true;
  mapError.value = null;

  if (typeof window === 'undefined' || !window.google?.maps) {
    mapError.value = new Error('Skript Google Máp nie je dostupný.');
    isInitializingMap.value = false;
    return;
  }

  await nextTick();
  if (!mapDivRef.value) {
    mapError.value = new Error('Element kontajnera mapy sa nenašiel.');
    isInitializingMap.value = false;
    return;
  }

  try {
    const initialCenter = props.centerGeoPoint
      ? { lat: props.centerGeoPoint.latitude, lng: props.centerGeoPoint.longitude }
      : { lat: 48.7139, lng: 19.1544 };
    const initialZoom = props.centerGeoPoint ? 12 : 7;

    mapInstance.value = new window.google.maps.Map(mapDivRef.value, {
      center: initialCenter,
      zoom: initialZoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      clickableIcons: false,
    });

    if (!infoWindowInstance.value) {
      infoWindowInstance.value = new window.google.maps.InfoWindow({
        maxWidth: 320, 
      });
    }
    
    if (props.roomsToDisplay?.length > 0) {
      updateMarkers(props.roomsToDisplay);
    }
    
    // Create initial search circle if needed
    if (props.centerGeoPoint && props.searchRadiusKm > 0) {
      updateSearchCircle();
    }
    
    firstLoad.value = false;

  } catch (e: unknown) {
    mapError.value = e instanceof Error ? e : new Error('Chyba pri inicializácii mapy.');
  } finally {
    isInitializingMap.value = false;
  }
}

function updateMarkers(newRoomsData: Readonly<Room[]>) {
  const map = mapInstance.value;
  const iw = infoWindowInstance.value;

  if (!map || isInitializingMap.value) return;
  if (!iw) {
    console.warn("Map.vue: InfoWindow inštancia nie je pripravená v updateMarkers.");
    return;
  }

  iw.close();
  currentMarkers.value.forEach(marker => marker.setMap(null));
  currentMarkers.value = [];
  
  const newMarkersArray: google.maps.Marker[] = [];
  const bounds = new window.google.maps.LatLngBounds();
  let markersAdded = 0;

  newRoomsData.forEach(room => {
    const coords = room.coordinates;
    if (coords && typeof coords.latitude === 'number' && typeof coords.longitude === 'number') {
      const position = { lat: coords.latitude, lng: coords.longitude };
      
      const marker = new window.google.maps.Marker({
        position,
        map,
        title: room.location || `Typ: ${room.propertyType}`,
      });
      
      marker.addListener('mouseover', () => {
        if (!iw || !map) return;
        const infoContent = createInfoWindowContent(room);
        iw.setContent(infoContent);
        attachInfoWindowDomListeners(iw, room);
        iw.open({ anchor: marker, map, shouldFocus: false });
      });
      
      marker.addListener('click', () => {
        if (!iw || !map) return;
        const isCurrentlyOpenOnThisMarker = iw.getMap() && iw.getAnchor() === marker;

        if (isCurrentlyOpenOnThisMarker) {
          iw.close(); 
        } else {
          const infoContent = createInfoWindowContent(room);
          iw.setContent(infoContent);
          attachInfoWindowDomListeners(iw, room);
          iw.open({ anchor: marker, map, shouldFocus: false });
        }
      });
      
      newMarkersArray.push(marker);
      bounds.extend(position);
      markersAdded++;
    }
  });
  
  currentMarkers.value = newMarkersArray;

  if (markersAdded > 0 && !props.centerGeoPoint) {
    map.fitBounds(bounds);
  } else if (markersAdded === 0 && !props.centerGeoPoint) {
     map.setCenter({ lat: 48.7139, lng: 19.1544 });
     map.setZoom(7);
  }
  firstLoad.value = false;
}

function updateSearchCircle() {
  const map = mapInstance.value;
  if (!map) {
    console.warn("Map.vue: updateSearchCircle called but map instance is not ready.");
    return;
  }

  // First, make sure to remove any existing circle
  clearSearchCircle();

  // Only create a new circle if we have valid center coordinates and a non-zero radius
  if (props.centerGeoPoint && props.searchRadiusKm > 0) {
    const center = {
      lat: props.centerGeoPoint.latitude,
      lng: props.centerGeoPoint.longitude,
    };
    
    searchCircle.value = new window.google.maps.Circle({
      strokeColor: '#007bff',
      strokeOpacity: 0.6,
      strokeWeight: 2,
      fillColor: '#007bff',
      fillOpacity: 0.15,
      map,
      center: center,
      radius: props.searchRadiusKm * 1000, // Convert km to meters
    });

    // Fit map to the new circle bounds
    if (searchCircle.value) {
      const circleBounds = searchCircle.value.getBounds();
      if (circleBounds) {
        map.fitBounds(circleBounds);
      }
    }
  } else if (!props.roomsToDisplay || props.roomsToDisplay.length === 0) {
    // If no center/radius and no rooms, reset to default view of Slovakia
    map.setCenter({ lat: 48.7139, lng: 19.1544 });
    map.setZoom(7);
  }
}

// New function to explicitly clear the search circle
function clearSearchCircle() {
  if (searchCircle.value) {
    searchCircle.value.setMap(null);
    searchCircle.value = null; // Important: Reset the reference to null
  }
}

// Watch for changes to centerGeoPoint or searchRadiusKm
watch(
  () => [props.centerGeoPoint, props.searchRadiusKm],
  () => {
    if (mapInstance.value) {
      // Clear existing circle and create a new one
      updateSearchCircle();
    }
  },
  { deep: true }
);

watch(() => props.roomsToDisplay, (newRooms) => {
  if (mapInstance.value) {
    updateMarkers(newRooms || []);
  }
}, { deep: true });

// Watch for modal closing to reset selectedRoom
watch(() => isModalOpen.value, (isOpen) => {
  if (!isOpen) {
    selectedRoom.value = null;
  }
});

onMounted(() => {
  const setupGoogleMapsDependents = () => {
    if (!infoWindowInstance.value && window.google?.maps) {
      infoWindowInstance.value = new window.google.maps.InfoWindow({ maxWidth: 320 });
    }
    initializeMap();
  };

  if (typeof window !== 'undefined' && window.google?.maps) {
    setupGoogleMapsDependents();
  } else {
    const checkGoogleMaps = setInterval(() => {
      if (typeof window !== 'undefined' && window.google?.maps) {
        clearInterval(checkGoogleMaps);
        setupGoogleMapsDependents();
      }
    }, 200);
    
    setTimeout(() => {
      clearInterval(checkGoogleMaps);
      if (!mapInstance.value && !mapError.value) {
        mapError.value = new Error('Google Mapy sa nepodarilo načítať v časovom limite.');
        isInitializingMap.value = false;
      }
    }, 10000);
  }
});

onUnmounted(() => {
  // Clean up all resources
  if (activeInfoWindowDomReadyListener.value) {
    google.maps.event.removeListener(activeInfoWindowDomReadyListener.value);
    activeInfoWindowDomReadyListener.value = null;
  }
  
  if (infoWindowInstance.value) {
    infoWindowInstance.value.close();
  }
  
  // Clear all markers
  currentMarkers.value.forEach(marker => marker.setMap(null));
  currentMarkers.value = [];
  
  // Clear search circle
  clearSearchCircle();
});
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
}
</style>

<style>
/* Non-scoped styles for Google Maps InfoWindow customization */
.gm-style .gm-style-iw-c {
  padding: 0 !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
  max-height: 400px !important;
  overflow: hidden;
}

.gm-style .gm-style-iw-d {
  overflow: auto !important;
  padding: 0px !important;
  max-height: 380px !important;
}

/* Move the close button to top-right over the image */
.gm-style .gm-style-iw-t {
  overflow: visible !important;
}

.gm-style .gm-style-iw-t::after {
  background: white !important; 
}

/* Hide the close button completely */
.gm-style .gm-ui-hover-effect {
  display: none !important;
}

/* Fix carousel arrow alignment */
#infoWindowPrevBtn, #infoWindowNextBtn {
  line-height: 0 !important;
  font-size: 24px !important;
}

.info-window-custom-content a:hover {
  background-color: #1D4ED8 !important;
}

/* Added for the modal button */
.info-window-custom-content button:hover {
  background-color: #1D4ED8 !important;
}
.gm-style .gm-style-iw-ch {
  display: none !important;
}
</style>