<template>
  <!-- Use v-if to ensure profile data is actually passed -->
  <div v-if="profile" class="mt-2 space-y-6 bg-white p-6 rounded shadow-md border">
    <h2 class="text-2xl font-bold mb-4 text-center">Váš Profil</h2>
    
    <!-- Images - Moved to top and made larger -->
    <div v-if="profile.images && profile.images.length > 0" class="mb-6">
      <div class="flex flex-wrap justify-center gap-3">
        <img v-for="(imgUrl, index) in profile.images" :key="index"
             :src="imgUrl" :alt="`Profilový obrázok ${index + 1}`"
             class="w-48 h-48 object-cover rounded-lg border shadow-sm hover:shadow-md transition-shadow">
      </div>
    </div>

    <!-- Basic Info -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm bg-gray-50 p-4 rounded-lg">
      <h3 class="col-span-full text-lg font-semibold mb-2 text-gray-800">Základné Informácie</h3>
      <p><strong>Meno:</strong> {{ profile.firstName || 'Neuvedené' }}</p>
      <p><strong>Vek:</strong> {{ profile.age || 'Neuvedený' }}</p>
      <p><strong>Pohlavie:</strong> {{ profile.gender || 'Neuvedené' }}</p>
      <p><strong>Email:</strong> {{ profile.email || 'Neuvedený' }}</p>
      <p><strong>Telefón:</strong> {{ profile.phoneNumber || 'Neuvedený' }}</p>
      <p><strong>Povolanie:</strong> {{ profile.occupation || 'Neuvedené' }}</p>
      <p><strong>Skupinový Záznam?</strong> {{ profile.isGroup ? 'Áno' : 'Nie' }}</p>
      <p v-if="profile.isGroup"><strong>Počet Členov Skupiny:</strong> {{ profile.groupMembers?.length || 0 }}</p>
      <p><strong>Spôsob Bývania:</strong> {{ profile.livingArrangement || 'Neuvedený' }}</p>
      <p><strong>Práca/Štúdium z Domu?</strong> {{ profile.workHome || 'Neuvedené' }}</p>
    </div>

    <!-- Bio -->
    <div class="bg-gray-50 p-4 rounded-lg">
      <h3 class="text-lg font-semibold mb-2 text-gray-800">Bio</h3>
      <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ profile.bio || 'Bio nebolo poskytnuté.' }}</p>
    </div>

    <!-- Housing Needs -->
    <div class="bg-gray-50 p-4 rounded-lg">
      <h3 class="text-lg font-semibold mb-2 text-gray-800">Požiadavky na Bývanie</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <p><strong>Požadovaná Lokalita:</strong> {{ profile.location || 'Neuvedená' }}</p>
        <p><strong>Rozpočet:</strong> €{{ profile.budget || 'Neuvedený' }} / mesiac</p>
        <p><strong>Preferovaný Dátum Sťahovania:</strong> {{ profile.preferredMoveDate ? formatDate(profile.preferredMoveDate, true) : 'Flexibilný' }}</p>
        <p><strong>Preferované Pohlavie (Spolubývajúci):</strong> {{ profile.preferredGender || 'Neuvedené' }}</p>
        <p><strong>Preferovaný Vekový Rozsah (Spolubývajúci):</strong> {{ profile.preferredAgeRange || 'Neuvedený' }}</p>
      </div>
    </div>

    <!-- Lifestyle -->
    <div class="bg-gray-50 p-4 rounded-lg">
      <h3 class="text-lg font-semibold mb-2 text-gray-800">Životný Štýl</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <p><strong>Obvyklý Čas Vstávania:</strong> {{ profile.wakeTime || 'Neuvedený' }}</p>
        <p><strong>Obvyklý Čas Spánku:</strong> {{ profile.bedTime || 'Neuvedený' }}</p>
        <p><strong>Denná Preferencia:</strong> {{ profile.dayPreference || 'Neuvedená' }}</p>
        <p><strong>Fajčiar?</strong> {{ profile.isSmoker ? 'Áno' : 'Nie' }}</p>
        <p><strong>Konzumácia Alkoholu:</strong> {{ profile.alcoholUse || 'Neuvedená' }}</p>
        <p><strong>Frekvencia Varenia:</strong> {{ profile.cookingFrequency || 'Neuvedená' }}</p>
        <p><strong>Stravovacia Preferencia:</strong> {{ profile.dietaryPreference || 'Neuvedená' }}</p>
        <p><strong>Frekvencia Návštev:</strong> {{ profile.guestFrequency || 'Neuvedená' }}</p>
        <p><strong>Úroveň Čistoty:</strong> {{ profile.cleanlinessLevel || 'Neuvedená' }}</p>
        <p><strong>Frekvencia Upratovania:</strong> {{ profile.cleaningFrequency || 'Neuvedená' }}</p>
        <p><strong>Tolerancia Hluku:</strong> {{ profile.noiseTolerance || 'Neuvedená' }}</p>
        <p><strong>Stav Detí:</strong> {{ profile.childrenStatus || 'Neuvedený' }}</p>
      </div>
    </div>

    <!-- Pets -->
    <div class="bg-gray-50 p-4 rounded-lg">
      <h3 class="text-lg font-semibold mb-2 text-gray-800">Domáce Zvieratá</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <p><strong>Má Domáce Zvieratá?</strong> {{ profile.hasPets ? 'Áno' : 'Nie' }}</p>
        <p v-if="profile.hasPets"><strong>Vlastník Psa?</strong> {{ profile.hasDog ? 'Áno' : 'Nie' }}</p>
        <p v-if="profile.hasPets"><strong>Vlastník Mačky?</strong> {{ profile.hasCat ? 'Áno' : 'Nie' }}</p>
        <p v-if="profile.hasPets"><strong>Iné Zvieratá?</strong> {{ profile.hasOtherPets ? 'Áno' : 'Nie' }}</p>
      </div>
    </div>

    <!-- Education (Conditional) -->
    <div v-if="profile.student" class="bg-gray-50 p-4 rounded-lg">
      <h3 class="text-lg font-semibold mb-2 text-gray-800">Vzdelanie</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <p><strong>Študent?</strong> Áno</p>
        <p><strong>Škola:</strong> {{ profile.selectedSchool || 'Neuvedená' }}</p>
        <p><strong>Fakulta:</strong> {{ profile.selectedFaculty || 'Neuvedená' }}</p>
        <p><strong>Študijný Program:</strong> {{ profile.studyProgram || 'Neuvedený' }}</p>
      </div>
    </div>
    <p v-else class="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg"><strong>Študent?</strong> Nie</p>

    <!-- Meta -->
    <p v-if="profile.updatedAt" class="text-xs text-gray-500 text-center">
      Profil naposledy aktualizovaný: {{ formatDate(profile.updatedAt) }}
    </p>
  </div>
  <div v-else class="text-gray-500 p-4 text-center">Načítavajú sa údaje profilu...</div>
</template>

<script setup>
import { formatDate } from '~/utils/formatters'; // Assuming you move formatDate

// Define props the component expects
defineProps({
  profile: {
    // Can use your Roommate interface here if imported project-wide
    type: Object,
    required: false, // Can be null/undefined while loading
    default: null
  }
});

// Note: formatDate is now imported, not passed as a prop
</script>