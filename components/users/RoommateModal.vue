<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-gradient-to-br from-gray-300/70 to-gray-400/70 flex justify-center items-center z-50 p-4 overflow-hidden"
    @click="closeModal"
>
    <div 
      class="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto relative" 
      @click.stop
    >
      <!-- Back Button -->
      <button
        @click="$emit('close')"
        class="absolute top-4 left-4 z-10 group flex items-center text-gray-600 hover:text-blue-600 transition-colors duration-200"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          class="h-10 w-10 mr-2 group-hover:-translate-x-1 transition-transform"
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          stroke-width="1.5"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        <span class="font-medium text-lg">Späť</span>
      </button>

      <!-- Image Gallery -->
      <div class="grid grid-cols-[2fr_1fr_1fr] gap-2 p-4 pb-0 mt-12">
        <div 
          v-for="(image, index) in displayedImages" 
          :key="index"
          class="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
          :class="[
            displayedImages.length === 1 ? 'col-span-3 mx-auto w-1/2' : '',
            index === 0 ? 'row-span-2' : ''
          ]"
          @click="showFullGallery = true"
        >
          <img
            :src="image.url"
            :alt="`Thumbnail ${index + 1}`"
            loading="lazy"
            class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              class="h-12 w-12 text-white" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              stroke-width="1.5"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        </div>

        <!-- See All Photos Button -->
        <div 
          v-if="processedImages.length > 5" 
          class="absolute bottom-4 right-4"
        >
          <button
            @click="showFullGallery = true"
            class="bg-white/80 hover:bg-blue-100 text-blue-800 px-4 py-2 rounded-full flex items-center gap-2 shadow-md transition-all duration-200"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              class="h-6 w-6" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              stroke-width="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            Všetky fotky ({{ processedImages.length }})
          </button>
        </div>
      </div>

      <!-- Profile Content -->
      <div class="p-6 pt-2">
        <div class="flex flex-col md:flex-row gap-6">
          <!-- Personal Profile Section -->
          <div class="flex-1">
            <h2 class="text-3xl font-bold text-blue-800 mb-4">{{ roommate.firstName }}</h2>
            <p class="text-gray-600 mb-4 leading-relaxed">{{ roommate.bio }}</p>
            
            <div class="bg-blue-50 rounded-xl p-4 mb-4">
              <p class="text-xl font-semibold text-blue-700">
                Rozpočet: {{ roommate.budget }}€
              </p>
            </div>

            <!-- Basic Info Grid -->
            <div class="grid grid-cols-2 gap-3 text-sm text-gray-700">
              <InfoItem 
                emoji="🎂" 
                :label="roommate.age" 
              />
              <InfoItem 
                emoji="👤" 
                :label="roommate.gender" 
              />
              <InfoItem 
                emoji="🎓" 
                :label="roommate.student ? 'Študent' : 'Nie je študent'" 
              />
              <InfoItem 
                emoji="📍 Hľadám v:" 
                :label="roommate.location" 
              />
              <InfoItem 
                emoji="💼" 
                :label="roommate.occupation == '' ? 'Nezamestnaný': roommate.occupation" 
              />
              <InfoItem 
                emoji="✉️" 
                :label="roommate.email" 
              />
              <InfoItem 
                emoji="📞" 
                :label="roommate.phoneNumber" 
              />
              <InfoItem 
              emoji="📅 Pripravený sa nasťahovať:" 
              :label="roommate.preferredMoveDate" 
            />
            </div>
          </div>

          
        </div>
        
        <div class="mt-6 bg-indigo-50 rounded-xl p-6">
          <h3 class="text-2xl font-semibold text-blue-900 mb-4">Detaily a Preferencie</h3>
            <div class="grid grid-cols-3 gap-3 text-gray-700">
              <InfoItem
                emoji="🏠 Pracujem/Študujem z domu:"
                :label="roommate.workHome"
              />
              <InfoItem
                emoji="🔊 Tolerancia na hluk:"
                :label="roommate.noiseTolerance"
              />
              <InfoItem
                emoji="🍽️"
                :label="roommate.dietaryPreference"
              />
              <InfoItem
                emoji="🚬"
                :label="roommate.isSmoker ? 'Fajčiar' : 'Nefajčiar'"
              />
              <InfoItem
                emoji="🍺 Alkohol:"
                :label="roommate.alcoholUse"
              />
              <InfoItem
                emoji="👥 Návštevy:"
                :label="roommate.guestFrequency"
              />
            </div>
        </div>
        <!-- Living Preferences Section -->
        <div class="mt-6 bg-indigo-50 rounded-xl p-6">
          <!-- Detailed Preferences Section -->
          <h3 class="text-2xl font-semibold text-indigo-900 mb-4">Bytové Preferencie</h3>
          <div class="grid grid-cols-3 gap-3 text-gray-700">
            <InfoItem 
              emoji="🏡" 
              :label="roommate.livingArrangement" 
            />
            <InfoItem 
              emoji="🌅" 
              :label="roommate.wakeTime" 
            />
            <InfoItem 
              emoji="🌙" 
              :label="roommate.bedTime" 
            />
            <InfoItem 
              emoji="🧹" 
              :label="roommate.cleanlinessLevel" 
            />
            <InfoItem 
              emoji="🧼" 
              :label="roommate.cleaningFrequency" 
            />
            <InfoItem 
              emoji="👨‍🍳" 
              :label="roommate.cookingFrequency" 
            />
          </div>
        </div>

        <!-- Pets and Additional Info -->
        <div class="mt-6 bg-green-50 rounded-xl p-6">
          <h3 class="text-2xl font-semibold text-green-900 mb-4">Domáce Zvieratá a Ďalšie Info</h3>
          <div class="grid grid-cols-3 gap-3 text-gray-700">
            <InfoItem 
              emoji="🐶" 
              :label="roommate.hasDog ? 'Má psa' : 'Nemá psa'" 
            />
            <InfoItem 
              emoji="🐱" 
              :label="roommate.hasCat ? 'Má mačku' : 'Nemá mačku'" 
            />
            <InfoItem 
              emoji="🐾" 
              :label="roommate.hasOtherPets ? 'Má iné zvieratá' : 'Nemá iné zvieratá'" 
            />
            <InfoItem 
              emoji="👶" 
              :label="roommate.childrenStatus" 
            />
            <InfoItem 
              emoji="👥" 
              :label="roommate.preferredGender" 
            />
            <InfoItem 
              emoji="🔢" 
              :label="roommate.preferredAgeRange" 
            />
          </div>
        </div>

        <!-- School Information -->
        <div v-if="roommate.selectedSchool!= ''" class="mt-6 bg-purple-50 rounded-xl p-6">
          <h3 class="text-2xl font-semibold text-purple-900 mb-4">Vzdelanie</h3>
          <div class="grid grid-cols-3 gap-3 text-gray-700">
            <InfoItem 
              emoji="🏫" 
              :label="roommate.selectedSchool" 
            />
            <InfoItem 
              emoji="🎓" 
              :label="roommate.selectedFaculty" 
            />
            <InfoItem 
              emoji="📚" 
              :label="roommate.studyProgram" 
            />
          </div>
        </div>
        <div v-if="loggedInUser" class="mt-6 h-full flex flex-col">
            <ChatWindow
              :other-user-id="roommate.id"
              :other-user-name="roommate.firstName"
              class="flex-grow min-h-0"
            />
          </div>
      </div>
      
    </div>
    
  </div>
  

  <FullGallery
    v-if="showFullGallery"
    :images="processedImages"
    @close="showFullGallery = false"
  />
</template>


<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import ChatWindow from '~/components/ChatWindow.vue'; 
import FullGallery from '../FullGallery.vue';
import InfoItem from './InfoItem.vue';
import type { Roommate } from '~/types/user';

const props = defineProps<{
  roommate: Roommate;
  isOpen: boolean;
}>();
const loggedInUser = useCurrentUser();
const emit = defineEmits(['close']);
const showFullGallery = ref(false);
const processedImages = ref<Array<{ url: string; width: number; height: number }>>([]);

const displayedImages = computed(() => processedImages.value.slice(0, 5));

const loadImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.src = url;
  });
};
const showChatView = ref(false);
watch(() => props.isOpen, (newVal) => {
    if (newVal) {
        showChatView.value = false; // Default to profile view when opening
    }
});
watch(() => props.roommate.id, () => {
     showChatView.value = false; // Reset to profile view if roommate changes while open
});
const openChat = () => {
  // *** ADD GUARD in method too ***
  if (!loggedInUser.value || loggedInUser.value.uid === props.roommate.id) {
      console.warn("Cannot open chat: User not logged in or trying to chat with self.");
      // Optionally show a message to the user
      // alert("You must be logged in to chat.");
      return;
  }
  showChatView.value = true;
};
onMounted(async () => {
  // Process images to get their dimensions
  processedImages.value = await Promise.all(
    props.roommate.images.map(async (url) => {
      const dimensions = await loadImageDimensions(url);
      return {
        url,
        ...dimensions
      };
    })
  );
});

const closeModal = () => {
  emit('close');
};
</script>

<style scoped>
/* Custom scrollbar for modal */
.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}
.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
}
.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}
.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>