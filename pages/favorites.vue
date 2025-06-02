<template>
  <div class="bg-slate-50 min-h-screen -mt-4 pb-16">
    <!-- Vylepšená Hlavička -->
    <div class="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white py-16 px-6 sm:px-10 shadow-2xl overflow-hidden">
      <div class="absolute inset-0 bg-black/10"></div>
      <div class="absolute top-0 left-0 w-full h-full">
        <div class="absolute top-10 left-10 w-20 h-20 bg-white/5 rounded-full animate-pulse"></div>
        <div class="absolute top-20 right-20 w-16 h-16 bg-white/10 rounded-full animate-pulse delay-500"></div>
        <div class="absolute bottom-10 left-1/4 w-12 h-12 bg-white/5 rounded-full animate-pulse delay-1000"></div>
      </div>
      <div class="max-w-6xl mx-auto relative z-10">
        <div class="flex items-center mb-4">
          <div class="bg-white/20 backdrop-blur-sm rounded-full p-3 mr-4">
            <span class="material-symbols-outlined text-3xl">favorite</span>
          </div>
          <div>
            <h1 class="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Moje Obľúbené
            </h1>
            <p class="text-blue-100 text-lg">Vaše uložené izby a spolubývajúci</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Hlavný Obsah -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
      <!-- Vyžaduje sa Prihlásenie -->
      <div v-if="!currentUser" class="bg-white/90 backdrop-blur-lg shadow-2xl rounded-2xl p-8 text-center border border-slate-200 mt-8">
         <div class="w-20 h-20 bg-gradient-to-br from-blue-700 to-blue-800 rounded-full flex items-center justify-center shadow-2xl mx-auto mb-6">
            <span class="material-symbols-outlined text-4xl text-white">login</span>
          </div>
          <h2 class="text-2xl font-bold text-slate-800 mb-3">Prístup k Vašim Obľúbeným</h2>
          <p class="text-slate-600 mb-6">Prosím, prihláste sa pre zobrazenie a správu vašich uložených položiek.</p>
          <button
            @click="redirectToLogin"
            class="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white font-semibold py-3 px-8 rounded-xl transition-colors duration-200 flex items-center justify-center mx-auto"
          >
            <span class="material-symbols-outlined mr-2">login</span>
            Prihlásiť sa / Registrovať sa
          </button>
      </div>

      <!-- Vylepšený Stav Načítavania -->
      <div v-else-if="isLoading" class="flex flex-col items-center justify-center py-20">
        <div class="relative mb-8">
          <div class="w-20 h-20 border-4 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div class="text-center">
          <p class="text-xl font-semibold text-slate-700 mb-2">Načítavam vaše obľúbené...</p>
        </div>
        <div class="w-full mt-12 space-y-8">
          <div class="flex justify-center">
            <div class="bg-white/90 backdrop-blur-lg shadow-2xl rounded-2xl p-2 flex gap-2 border border-slate-200">
              <div class="h-12 w-32 bg-slate-200 rounded-xl animate-pulse"></div>
              <div class="h-12 w-24 bg-slate-200 rounded-xl animate-pulse delay-100"></div>
              <div class="h-12 w-36 bg-slate-200 rounded-xl animate-pulse delay-200"></div>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div v-for="i in 6" :key="`skel-${i}`" class="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
              <div class="h-48 bg-slate-200 rounded-xl mb-4"></div>
              <div class="space-y-3">
                <div class="h-4 bg-slate-200 rounded w-3/4"></div>
                <div class="h-4 bg-slate-200 rounded w-1/2"></div>
                <div class="h-8 w-32 bg-slate-200 rounded-lg mt-4"></div> <!-- Placeholder pre akčné tlačidlo -->
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Stav Chyby -->
      <div v-else-if="pageError" class="mb-8 mt-8">
        <div class="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-2xl p-6 shadow-lg">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <div class="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <span class="material-symbols-outlined text-red-600 text-lg">error</span>
              </div>
            </div>
            <div class="ml-4 flex-1">
              <h3 class="text-lg font-semibold text-red-800 mb-1">Ups! Niečo sa pokazilo</h3>
              <p class="text-red-700 mb-4">{{ pageError.message || 'Nepodarilo sa načítať obľúbené.' }}</p>
              <button
                @click="pageError = null"
                class="inline-flex items-center px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 font-medium rounded-lg transition-colors duration-200"
              >
                <span class="material-symbols-outlined mr-2 text-sm">close</span>
                Zavrieť
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Obsah keď sa nenačítava, nie je chyba a používateľ je prihlásený -->
      <div v-else>
        <!-- Navigácia Kariet (Tabov) -->
        <div class="flex justify-center my-12">
           <div class="bg-white/90 backdrop-blur-lg shadow-2xl rounded-2xl p-2 flex flex-wrap gap-2 border border-slate-200">
            <button
              @click="activeTab = 'all'"
              :class="[activeTab === 'all' ? 'bg-gradient-to-r from-blue-700 to-blue-800 text-white shadow-lg' : 'text-slate-700 hover:bg-slate-100']"
              class="flex items-center px-6 py-3 rounded-xl font-semibold transition-colors duration-200"
            >
              <span class="material-symbols-outlined mr-2 text-lg">list</span>
              Všetky
              <span v-if="totalFavoritesCount > 0"
                    :class="activeTab === 'all' ? 'bg-white/20' : 'bg-blue-100 text-blue-700'"
                    class="ml-2 px-2 py-0.5 rounded-full text-xs font-bold">
                {{ totalFavoritesCount }}
              </span>
            </button>
            <button
              @click="activeTab = 'rooms'"
              :class="[activeTab === 'rooms' ? 'bg-gradient-to-r from-blue-700 to-blue-800 text-white shadow-lg' : 'text-slate-700 hover:bg-slate-100']"
              class="flex items-center px-6 py-3 rounded-xl font-semibold transition-colors duration-200"
            >
              <span class="material-symbols-outlined mr-2 text-lg">home</span>
              Izby
              <span v-if="favoritedRooms.length > 0"
                    :class="activeTab === 'rooms' ? 'bg-white/20' : 'bg-blue-100 text-blue-700'"
                    class="ml-2 px-2 py-0.5 rounded-full text-xs font-bold">
                {{ favoritedRooms.length }}
              </span>
            </button>
            <button
              @click="activeTab = 'roommates'"
              :class="[activeTab === 'roommates' ? 'bg-gradient-to-r from-blue-700 to-blue-800 text-white shadow-lg' : 'text-slate-700 hover:bg-slate-100']"
              class="flex items-center px-6 py-3 rounded-xl font-semibold transition-colors duration-200"
            >
              <span class="material-symbols-outlined mr-2 text-lg">group</span>
              Spolubývajúci
              <span v-if="favoritedRoommates.length > 0"
                    :class="activeTab === 'roommates' ? 'bg-white/20' : 'bg-blue-100 text-blue-700'"
                    class="ml-2 px-2 py-0.5 rounded-full text-xs font-bold">
                {{ favoritedRoommates.length }}
              </span>
            </button>
          </div>
        </div>

        <!-- Prázdny Stav -->
        <div v-if="!hasAnyFilteredFavorites" class="bg-gradient-to-br from-blue-50 to-slate-50 rounded-3xl shadow-xl p-12 text-center border border-blue-100">
           <div class="relative inline-block mb-6">
            <div class="w-24 h-24 bg-gradient-to-br from-blue-700 to-blue-800 rounded-full flex items-center justify-center shadow-2xl">
              <span class="material-symbols-outlined text-4xl text-white">sentiment_very_dissatisfied</span>
            </div>
          </div>
          <h2 class="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-700 to-blue-800 bg-clip-text text-transparent">
            Zatiaľ žiadne obľúbené
          </h2>
          <p class="text-slate-600 mb-8 text-lg max-w-md mx-auto">
            Vyzerá to, že ste si zatiaľ nepridali žiadne {{ activeTab === 'all' ? 'položky' : (activeTab === 'rooms' ? 'izby' : 'spolubývajúcich') }} medzi obľúbené. Začnite objavovať!
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <NuxtLink
              to="/searchroom"
              class="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center"
            >
              <span class="material-symbols-outlined mr-2">search</span>
              Nájsť Izby
            </NuxtLink>
            <NuxtLink
              to="/searchuser"
              class="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center"
            >
              <span class="material-symbols-outlined mr-2">person_search</span>
              Nájsť Spolubývajúcich
            </NuxtLink>
          </div>
        </div>

        <div v-else class="space-y-12">
          <!-- Sekcia Obľúbené Izby -->
          <section v-if="favoritedRooms.length > 0 && (activeTab === 'all' || activeTab === 'rooms')">
            <div class="flex items-center mb-8">
              <div class="bg-gradient-to-r from-blue-700 to-blue-800 rounded-full p-2 mr-3">
                <span class="material-symbols-outlined text-white text-xl">home</span>
              </div>
              <h2 class="text-3xl font-bold text-slate-800">Obľúbené Izby</h2>
              <span class="ml-3 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                {{ favoritedRooms.length }}
              </span>
            </div>
            <div class="flex flex-wrap gap-6 justify-start">
              <div
                v-for="favDoc in favoritedRooms"
                :key="favDoc.item.id"
                class="flex-none"
              >
                <RoomItem :room="(favDoc.item as Room)" />
                <!-- ODSTRÁNENÉ Tlačidlo Odstrániť Obľúbené -->
              </div>
            </div>
          </section>

          <!-- Sekcia Obľúbení Spolubývajúci -->
          <section v-if="favoritedRoommates.length > 0 && (activeTab === 'all' || activeTab === 'roommates')">
            <div class="flex items-center mb-8">
              <div class="bg-gradient-to-r from-slate-600 to-slate-700 rounded-full p-2 mr-3">
                <span class="material-symbols-outlined text-white text-xl">group</span>
              </div>
              <h2 class="text-3xl font-bold text-slate-800">Obľúbení Spolubývajúci</h2>
              <span class="ml-3 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-semibold">
                {{ favoritedRoommates.length }}
              </span>
            </div>
            <div class="flex flex-wrap gap-6 justify-start">
              <div
                v-for="favDoc in favoritedRoommates"
                :key="favDoc.item.id"
                class="flex-none"
              >
                <RoommateItem :roommate="(favDoc.item as Roommate)" />
                <!-- ODSTRÁNENÉ Tlačidlo Odstrániť Obľúbené -->
              </div>
            </div>
          </section>

           <div v-if="activeTab !== 'all' && !hasAnyFilteredFavorites && totalFavoritesCount > 0"
               class="text-center py-10 text-slate-600">
            <p>Vo vašich obľúbených sa nenašli žiadne {{ activeTab === 'rooms' ? 'izby' : 'spolubývajúci' }}.</p>
            <button @click="activeTab = 'all'" class="mt-4 text-blue-600 hover:underline">
              Zobraziť všetky obľúbené
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useCurrentUser } from 'vuefire';
import { useRouter } from 'vue-router';
import type { Roommate } from '~/types/user';
import type { Room } from '~/types/room';
import type { Ref } from 'vue';
import type { FirestoreError, DocumentData, Timestamp, GeoPoint } from 'firebase/firestore';

// Návratový typ Vuefire useCollection
interface UseCollectionReturn<T = DocumentData> {
  data: Ref<T[]>;
  pending: Ref<boolean>;
  error: Ref<FirestoreError | undefined>;
  promise: Ref<Promise<T[]>>;
}

// Váš composable a typy
import { useFavorites, type FavoriteItem } from '@/composables/useFavorites';

// Import zobrazovacích komponentov
import RoomItem from '~/components/rooms/RoomItem.vue';
import RoommateItem from '~/components/users/RoommateItem.vue';

const currentUser = useCurrentUser();
const router = useRouter();

const {
  favorites: favoritesDataFromComposable,
  // ODSTRÁNENÉ removeFavorite z deštrukturalizácie
} = useFavorites();

const activeTab = ref<'all' | 'rooms' | 'roommates'>('all');
const localPageError = ref<FirestoreError | Error | string | null>(null);

const isLoading = computed(() => {
  if (!currentUser.value) return false;
  return (favoritesDataFromComposable as UseCollectionReturn).pending?.value ?? false;
});

const pageError = computed({
    get: () => {
        if (localPageError.value) {
            if (typeof localPageError.value === 'string') return { message: localPageError.value } as FirestoreError;
            return localPageError.value as FirestoreError;
        }
        if (!currentUser.value) return null;
        return (favoritesDataFromComposable as UseCollectionReturn).error?.value ?? null;
    },
    set: (val: FirestoreError | Error | string | null) => { localPageError.value = val; }
});

const allFavoriteDocs = computed(() => {
  if (!currentUser.value) {
    return [];
  }
  const source = favoritesDataFromComposable as UseCollectionReturn<DocumentData & { item: FavoriteItem; id: string }>;
  const rawData = source?.data?.value || [];

  return rawData.map(doc => {
    if (!doc.item || typeof (doc.item as any).id !== 'string') {
      console.warn(`Dokument obľúbenej položky (ID: ${doc.id}) obsahuje položku bez platnej vlastnosti 'id'. Táto položka sa nemusí správne zobraziť. Údaje položky:`, JSON.parse(JSON.stringify(doc.item)));
    }
    return {
      docId: doc.id,
      item: doc.item as FavoriteItem
    };
  });
});

const isRoom = (item: FavoriteItem): item is Room => {
  return item &&
         typeof (item as any).id === 'string' &&
         typeof (item as any).propertyType === 'string' &&
         typeof (item as any).aboutProperty === 'string' &&
         !(item as any).firstName;
};

const isRoommate = (item: FavoriteItem): item is Roommate => {
  return item &&
         typeof (item as any).id === 'string' &&
         typeof (item as any).firstName === 'string' &&
         typeof (item as any).age === 'number' &&
         !(item as any).propertyType;
};

const favoritedRooms = computed(() => allFavoriteDocs.value.filter(favDoc => favDoc.item && isRoom(favDoc.item)));
const favoritedRoommates = computed(() => allFavoriteDocs.value.filter(favDoc => favDoc.item && isRoommate(favDoc.item)));

const totalFavoritesCount = computed(() => allFavoriteDocs.value.length);

const hasAnyFilteredFavorites = computed(() => {
    if (activeTab.value === 'all') {
        return favoritedRooms.value.length > 0 || favoritedRoommates.value.length > 0;
    } else if (activeTab.value === 'rooms') {
        return favoritedRooms.value.length > 0;
    } else if (activeTab.value === 'roommates') {
        return favoritedRoommates.value.length > 0;
    }
    return false;
});

// ODSTRÁNENÁ funkcia handleRemoveFavorite

const redirectToLogin = () => { router.push('/login'); }; // Upravte podľa vašej prihlasovacej cesty

watch(() => currentUser.value && (favoritesDataFromComposable as UseCollectionReturn).error?.value, (newError) => {
    if (newError) { localPageError.value = newError; }
});

// Pre ladenie:
watch(allFavoriteDocs, (newFavs) => {
  console.log("STRÁNKA OBĽÚBENÝCH: Spracované dokumenty obľúbených položiek:", JSON.parse(JSON.stringify(newFavs)));
  newFavs.forEach(fav => {
    if (fav.item) {
      const item = fav.item as any; // Pretypovanie na any pre prístup k vlastnostiam pre logovanie
      console.log(`STRÁNKA OBĽÚBENÝCH: ID Položky: ${item.id}, typNehnuteľnosti: ${item.propertyType}, meno: ${item.firstName}, Je Izba? ${isRoom(fav.item)}, Je Spolubývajúci? ${isRoommate(fav.item)}`);
    }
  });
}, { deep: true });

</script>

<style scoped>
.material-symbols-outlined {
  font-variation-settings:
  'FILL' 0,
  'wght' 300,
  'GRAD' 0,
  'opsz' 24;
}
.bg-clip-text {
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.relative.bg-gradient-to-br .material-symbols-outlined { /* Ikona v Hlavičke */
  font-size: 2rem;
  font-variation-settings: 'FILL' 1, 'opsz' 48;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .5; }
}
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>