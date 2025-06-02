// components/Map.vue
<template>
  <ClientOnly>
    <div class="map-container w-full h-full relative min-h-[300px] sm:min-h-[400px] lg:min-h-[500px] xl:min-h-0">
      <div v-if="isInitializingMap || (firstLoad && props.roomsToDisplay.length === 0)" class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
        <span class="text-sm sm:text-base text-gray-600 px-4 text-center">Načítavam mapu a dáta...</span>
      </div>
      <div v-if="mapError" class="absolute inset-0 flex flex-col items-center justify-center bg-red-100 bg-opacity-90 z-10 p-2 sm:p-4 text-center">
         <span class="text-red-700 text-xs sm:text-sm px-2">Chyba mapy: {{ mapError.message }}</span>
      </div>
      <div ref="mapDivRef" class="w-full h-full bg-gray-300 min-h-[300px] sm:min-h-[400px] lg:min-h-[500px] xl:min-h-0">
         <div v-if="!mapInstance && !mapError && !isInitializingMap" class="flex items-center justify-center h-full text-gray-400 text-xs sm:text-sm italic px-4 text-center">
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

// Responsive breakpoint detection
const isMobile = ref(false);
const isTablet = ref(false);

// Check screen size
const checkScreenSize = () => {
  if (typeof window !== 'undefined') {
    isMobile.value = window.innerWidth < 640; // sm breakpoint
    isTablet.value = window.innerWidth >= 640 && window.innerWidth < 1024; // sm to lg
  }
};

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

// Responsive InfoWindow content creation
function createInfoWindowContent(room: Room): string {
  const images = room.images && room.images.length > 0 ? room.images : ['/images/placeholder.jpg'];
  const initialImageSrc = images[0];
  
  // Responsive dimensions based on screen size
  const containerWidth = isMobile.value ? 280 : isTablet.value ? 320 : 340;
  const imageHeight = isMobile.value ? 140 : isTablet.value ? 160 : 180;
  const fontSize = isMobile.value ? '0.8em' : '0.85em';
  const buttonPadding = isMobile.value ? '6px 10px' : '8px 14px';
  
  const imageAltText = `Obrázok ${room.propertyType ? room.propertyType.toLowerCase() : 'nehnuteľnosti'}`;

  let content = `<div class="info-window-custom-content" style="width: ${containerWidth}px; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; line-height: 1.4;">`;

  // Responsive image carousel section
  content += `<div style="position: relative; margin-bottom: 10px; background-color: #e0e0e0; height: ${imageHeight}px; overflow: hidden; border-radius: 8px 8px 0 0; line-height: 0;">`;
  content += `<img id="infoWindowImage" src="${initialImageSrc}" alt="${imageAltText}" style="width: 100%; height: ${imageHeight}px; object-fit: cover; display: block;" />`;

  if (images.length > 1) {
    const buttonSize = isMobile.value ? 28 : 32;
    const arrowSize = isMobile.value ? 16 : 20;
    content += `
      <button id="infoWindowPrevBtn" aria-label="Predchádzajúci obrázok" style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.5); color: white; border: none; border-radius: 50%; width: ${buttonSize}px; height: ${buttonSize}px; cursor: pointer; font-size: ${arrowSize}px; padding: 0; display: flex; align-items: center; justify-content: center;">
        ‹
      </button>
      <button id="infoWindowNextBtn" aria-label="Nasledujúci obrázok" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.5); color: white; border: none; border-radius: 50%; width: ${buttonSize}px; height: ${buttonSize}px; cursor: pointer; font-size: ${arrowSize}px; padding: 0; display: flex; align-items: center; justify-content: center;">
        ›
      </button>
    `;
  }
  content += `</div>`;

  // Responsive content section
  const padding = isMobile.value ? '0 8px 8px 8px' : '0 12px 12px 12px';
  content += `<div style="padding: ${padding};">`;
  
  const titleLength = isMobile.value ? 25 : 35;
  const titleFontSize = isMobile.value ? '0.95em' : '1.05em';
  content += `<h3 style="margin: 0 0 6px; font-weight: 600; font-size: ${titleFontSize}; line-height: 1.3; color: #111827;">${room.location ? truncateText(room.location, titleLength) : (room.propertyType || 'Neznámy typ')}</h3>`;
  
  const priceToDisplay = room.budget;
  if (priceToDisplay) {
    const priceFontSize = isMobile.value ? '0.85em' : '0.95em';
    content += `<div style="margin-bottom: 8px; font-size: ${priceFontSize}; color: #1D4ED8; font-weight: 600;">${priceToDisplay} € / mesiac</div>`;
  }

  content += `<div style="font-size: ${fontSize}; color: #4B5563; margin-bottom: 4px;">`;
  let line1Details = [];
  if (room.propertyType) line1Details.push(`🏠 ${room.propertyType}`);
  if (room.roomType) line1Details.push(room.roomType);
  
  if (line1Details.length > 0 || room.bathroomType) {
    content += `<div style="display: ${isMobile.value ? 'block' : 'flex'}; ${!isMobile.value ? 'justify-content: space-between; width: 100%;' : ''} margin-bottom: 2px;">`;
    content += `<span style="${isMobile.value ? 'display: block; margin-bottom: 2px;' : ''}">${line1Details.join(' - ')}</span>`;
    if (room.bathroomType) {
      content += `<span style="white-space: nowrap;">🚿 ${room.bathroomType}</span>`;
    }
    content += `</div>`;
  }
  content += `</div>`;

  if (room.availableFrom) {
    content += `<div style="font-size: ${fontSize}; color: #4B5563; margin-bottom: 8px;">📅 Voľné od: ${room.availableFrom}</div>`;
  }
  
  if (room.aboutProperty) {
    const descriptionLength = isMobile.value ? 70 : 90;
    const descriptionFontSize = isMobile.value ? '0.75em' : '0.8em';
    content += `<p style="font-size: ${descriptionFontSize}; color: #6B7280; margin-bottom: 10px; max-height: 3.6em; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;">${truncateText(room.aboutProperty, descriptionLength)}</p>`;
  }
  
  if (room.id) {
    const buttonFontSize = isMobile.value ? '0.8em' : '0.875em';
    content += `<div style="margin-top: 12px; text-align: right;">
      <button id="openModalBtn" data-room-id="${room.id}" style="color: #ffffff; background-color: #2563EB; text-decoration: none; font-size: ${buttonFontSize}; padding: ${buttonPadding}; border-radius: 6px; display: inline-block; font-weight: 500; transition: background-color 0.2s ease; border: none; cursor: pointer; touch-action: manipulation;">Viac detailov</button>
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

    // Add event listener for modal button with touch support
    if (modalBtn) {
      const openModalHandler = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        selectedRoom.value = room;
        isModalOpen.value = true;
        if (infoWindowInstance.value) {
          infoWindowInstance.value.close();
        }
      };
      
      modalBtn.addEventListener('click', openModalHandler);
      modalBtn.addEventListener('touchend', openModalHandler);
    }

    if (imagesFromRoom.length > 1 && imgElement && prevBtn && nextBtn) {
      let currentIndex = imagesFromRoom.indexOf(imgElement.src);
      if (currentIndex === -1 || currentIndex >= imagesFromRoom.length) {
        currentIndex = 0; 
        // Ensure the imgElement.src is set if it wasn't found or was out of bounds
        if (imgElement) imgElement.src = imagesFromRoom[currentIndex];
      }

      const updateImage = () => {
        if (imgElement) {
          const newImageSrc = imagesFromRoom[currentIndex];
          const tempImg = new Image();
          tempImg.onload = () => { if (imgElement) imgElement.src = newImageSrc; }; // Check imgElement again in async callback
          tempImg.onerror = () => { if (imgElement) imgElement.src = '/images/placeholder.jpg'; }; // Check imgElement again
          tempImg.src = newImageSrc;
        }
      };

      const prevHandler = (e: Event) => {
        e.preventDefault(); // <--- ADD THIS
        e.stopPropagation();
        currentIndex = (currentIndex - 1 + imagesFromRoom.length) % imagesFromRoom.length;
        updateImage();
      };

      const nextHandler = (e: Event) => {
        e.preventDefault(); // <--- ADD THIS
        e.stopPropagation();
        currentIndex = (currentIndex + 1) % imagesFromRoom.length;
        updateImage();
      };

      // Add both click and touch events for better mobile support
      // It's good practice to remove old listeners before adding new ones if elements persist,
      // but since domready re-creates content, this might be implicitly handled.
      // However, explicit removal is safer if there's any doubt.
      // For simplicity, assuming new buttons are created each time domready fires for new content.
      prevBtn.addEventListener('click', prevHandler);
      prevBtn.addEventListener('touchend', prevHandler);
      nextBtn.addEventListener('click', nextHandler);
      nextBtn.addEventListener('touchend', nextHandler);
      
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
    
    // Responsive zoom levels
    const getInitialZoom = () => {
      if (props.centerGeoPoint) {
        return isMobile.value ? 11 : isTablet.value ? 12 : 12;
      }
      return isMobile.value ? 6 : 7;
    };

    mapInstance.value = new window.google.maps.Map(mapDivRef.value, {
      center: initialCenter,
      zoom: getInitialZoom(),
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      clickableIcons: false,
      // Responsive map controls
      zoomControl: !isMobile.value,
      scaleControl: !isMobile.value,
      gestureHandling: isMobile.value ? 'cooperative' : 'auto',
    });

    if (!infoWindowInstance.value) {
      const maxWidth = isMobile.value ? 300 : isTablet.value ? 340 : 360;
      infoWindowInstance.value = new window.google.maps.InfoWindow({
        maxWidth: maxWidth,
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
      
      // Mobile-friendly interaction - click only on mobile, hover + click on desktop
      if (isMobile.value) {
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
      } else {
        // Desktop behavior - hover and click
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
      }
      
      newMarkersArray.push(marker);
      bounds.extend(position);
      markersAdded++;
    }
  });
  
  currentMarkers.value = newMarkersArray;

  if (markersAdded > 0 && !props.centerGeoPoint) {
    // Add responsive padding to bounds
    const padding = isMobile.value ? 20 : isTablet.value ? 40 : 60;
    map.fitBounds(bounds, padding);
  } else if (markersAdded === 0 && !props.centerGeoPoint) {
     map.setCenter({ lat: 48.7139, lng: 19.1544 });
     map.setZoom(isMobile.value ? 6 : 7);
  }
  firstLoad.value = false;
}

function updateSearchCircle() {
  const map = mapInstance.value;
  if (!map) {
    console.warn("Map.vue: updateSearchCircle called but map instance is not ready.");
    return;
  }

  clearSearchCircle();

  if (props.centerGeoPoint && props.searchRadiusKm > 0) {
    const center = {
      lat: props.centerGeoPoint.latitude,
      lng: props.centerGeoPoint.longitude,
    };
    
    searchCircle.value = new window.google.maps.Circle({
      strokeColor: '#007bff',
      strokeOpacity: 0.6,
      strokeWeight: isMobile.value ? 1.5 : 2,
      fillColor: '#007bff',
      fillOpacity: 0.15,
      map,
      center: center,
      radius: props.searchRadiusKm * 1000,
    });

    if (searchCircle.value) {
      const circleBounds = searchCircle.value.getBounds();
      if (circleBounds) {
        const padding = isMobile.value ? 20 : isTablet.value ? 40 : 60;
        map.fitBounds(circleBounds, padding);
      }
    }
  } else if (!props.roomsToDisplay || props.roomsToDisplay.length === 0) {
    map.setCenter({ lat: 48.7139, lng: 19.1544 });
    map.setZoom(isMobile.value ? 6 : 7);
  }
}

function clearSearchCircle() {
  if (searchCircle.value) {
    searchCircle.value.setMap(null);
    searchCircle.value = null;
  }
}

// Handle window resize
const handleResize = () => {
  checkScreenSize();
  if (mapInstance.value) {
    // Trigger map resize
    google.maps.event.trigger(mapInstance.value, 'resize');
    
    // Update InfoWindow max width
    if (infoWindowInstance.value) {
      const maxWidth = isMobile.value ? 300 : isTablet.value ? 340 : 360;
      infoWindowInstance.value.setOptions({ maxWidth });
    }
  }
};

// Watch for changes to centerGeoPoint or searchRadiusKm
watch(
  () => [props.centerGeoPoint, props.searchRadiusKm],
  () => {
    if (mapInstance.value) {
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

watch(() => isModalOpen.value, (isOpen) => {
  if (!isOpen) {
    selectedRoom.value = null;
  }
});

onMounted(() => {
  checkScreenSize();
  
  // Add resize listener
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleResize);
  }
  
  const setupGoogleMapsDependents = () => {
    if (!infoWindowInstance.value && window.google?.maps) {
      const maxWidth = isMobile.value ? 300 : isTablet.value ? 340 : 360;
      infoWindowInstance.value = new window.google.maps.InfoWindow({ maxWidth });
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
  // Remove resize listener
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleResize);
  }
  
  if (activeInfoWindowDomReadyListener.value) {
    google.maps.event.removeListener(activeInfoWindowDomReadyListener.value);
    activeInfoWindowDomReadyListener.value = null;
  }
  
  if (infoWindowInstance.value) {
    infoWindowInstance.value.close();
  }
  
  currentMarkers.value.forEach(marker => marker.setMap(null));
  currentMarkers.value = [];
  
  clearSearchCircle();
});
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
}

/* Ensure the map container is properly sized on all devices */
@media (max-width: 639px) {
  .map-container {
    min-height: 300px;
  }
}

@media (min-width: 640px) and (max-width: 1023px) {
  .map-container {
    min-height: 400px;
  }
}

@media (min-width: 1024px) {
  .map-container {
    min-height: 500px;
  }
}
</style>

<style>
/* Responsive InfoWindow styles */
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

.gm-style .gm-style-iw-t {
  overflow: visible !important;
}

.gm-style .gm-style-iw-t::after {
  background: white !important; 
}

.gm-style .gm-ui-hover-effect {
  display: none !important;
}

.gm-style .gm-style-iw-ch {
  display: none !important;
}

/* Mobile-specific adjustments */
@media (max-width: 639px) {
  .gm-style .gm-style-iw-c {
    max-width: 300px !important;
    max-height: 350px !important;
  }
  
  .gm-style .gm-style-iw-d {
    max-height: 330px !important;
  }
}

/* Tablet adjustments */
@media (min-width: 640px) and (max-width: 1023px) {
  .gm-style .gm-style-iw-c {
    max-width: 340px !important;
  }
}

/* Touch-friendly buttons */
@media (hover: none) and (pointer: coarse) {
  .info-window-custom-content button {
    min-height: 44px !important;
    min-width: 44px !important;
  }
}

/* Hover effects for desktop */
@media (hover: hover) and (pointer: fine) {
  .info-window-custom-content a:hover,
  .info-window-custom-content button:hover {
    background-color: #1D4ED8 !important;
  }
}

/* Fix carousel arrow alignment on all devices */
#infoWindowPrevBtn, #infoWindowNextBtn {
  line-height: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

/* Ensure proper spacing on mobile */
@media (max-width: 639px) {
  #infoWindowPrevBtn, #infoWindowNextBtn {
    font-size: 16px !important;
    width: 28px !important;
    height: 28px !important;
  }
}
</style>