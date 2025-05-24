<template>
  <!-- Use v-if to ensure profile data is actually passed and editableProfile is ready -->
  <div v-if="profile && editableProfile" class="mt-2 space-y-8">
    <!-- Header: Title only, edit buttons moved for non-image data -->
    <div class="flex justify-center items-center mb-6"> <!-- Centered Title -->
      <h2 class="text-2xl font-bold text-blue-800">🏠 Váš Profil</h2>
    </div>

    <!-- Profile Image Section with Integrated Change Icon/Button -->
    <div class="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-700 flex flex-col items-center">
      <h3 class="text-lg font-semibold mb-2 text-blue-800 self-start"><span class="mr-2">👤</span> Profilový Obrázok</h3>
      <div class="relative group w-40 h-40 md:w-48 md:h-48">
        <img
          :src="(profile.images && profile.images.length > 0 && profile.images[0]) || defaultAvatarUrl"
          @error="onImageError"
          alt="Profilový obrázok"
          class="w-full h-full object-cover rounded-full border-4 border-blue-200 shadow-lg bg-gray-200"
        />
        <!-- Image Change Trigger: Pen Icon - Always visible or on hover -->
        <div class="absolute bottom-1 right-1">
            <ProfileImageChanger
              :current-image-url="(profile.images && profile.images.length > 0 ? profile.images[0] : null)"
              :current-image-path="profile.avatarStoragePath"
              storage-path="images"
              @image-update-confirmed="handleImageUpdateConfirmed"
              @upload-error="(msg) => toast.error(`Chyba nahrávania obrázka: ${msg}`)"
              button-class="bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
              icon-class="w-5 h-5 text-blue-700"
            />
        </div>
      </div>
    </div>

    <!-- Edit/Save Buttons for NON-IMAGE Data -->
    <div class="flex justify-end items-center mb-6 sticky top-4 z-10 bg-opacity-80 backdrop-blur-sm py-2">
      <button v-if="!isEditing" @click="startEditingNonImageData" class="bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-300 flex items-center">
        <span class="mr-2">✏️</span> Upraviť Profilu
      </button>
      <div v-else class="flex gap-2">
        <button
          @click="saveNonImageData"
          :disabled="isSavingProfile"
          class="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-300 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span class="mr-2">💾</span>
          {{ isSavingProfile ? 'Ukladám...' : 'Uložiť Detaily' }}
        </button>
        <button
          @click="cancelNonImageDataEditing"
          :disabled="isSavingProfile"
          class="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-300 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span class="mr-2">❌</span> Zrušiť Úpravu Detailov
        </button>
      </div>
    </div>

    <!-- Basic Info Section (and other sections) - conditionally editable -->
    <div class="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-700">
      <h3 class="col-span-full text-lg font-semibold mb-3 text-blue-800 flex items-center"><span class="mr-2">ℹ️</span> Základné Informácie</h3>
       <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
        <!-- Fields are now editable based on 'isEditing' for non-image data -->
        <div class="transition-all duration-300 hover:bg-blue-50 p-3 rounded-lg"><strong class="text-blue-700">🏷️ Meno:</strong>
          <p v-if="!isEditing" class="mt-1 text-gray-800">{{ editableProfile.firstName || 'Neuvedené' }}</p>
          <input v-else type="text" v-model="editableProfile.firstName" class="mt-1 block w-full p-2 border border-blue-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
        </div>
        <div class="transition-all duration-300 hover:bg-blue-50 p-3 rounded-lg"><strong class="text-blue-700">🎂 Vek:</strong>
          <p v-if="!isEditing" class="mt-1 text-gray-800">{{ editableProfile.age || 'Neuvedený' }}</p>
          <input v-else type="number" v-model.number="editableProfile.age" class="mt-1 block w-full p-2 border border-blue-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
        </div>
        <div class="transition-all duration-300 hover:bg-blue-50 p-3 rounded-lg"><strong class="text-blue-700">🚻 Pohlavie:</strong>
          <p v-if="!isEditing" class="mt-1 text-gray-800">{{ editableProfile.gender || 'Neuvedené' }}</p>
          <select v-else v-model="editableProfile.gender" class="mt-1 block w-full p-2 border border-blue-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option disabled value="">Vyberte pohlavie</option>
            <option>Muž</option>
            <option>Žena</option>
            <option>Iné</option>
            <option>Preferujem neuvádzať</option>
          </select>
        </div>
        <div class="transition-all duration-300 hover:bg-blue-50 p-3 rounded-lg"><strong class="text-blue-700">📧 Email:</strong> <span class="text-gray-800">{{ editableProfile.email || 'Neuvedený' }}</span> <span class="text-xs text-gray-500">(nedá sa upraviť)</span></div>
        <div class="transition-all duration-300 hover:bg-blue-50 p-3 rounded-lg"><strong class="text-blue-700">📞 Telefón:</strong>
          <p v-if="!isEditing" class="mt-1 text-gray-800">{{ editableProfile.phoneNumber || 'Neuvedený' }}</p>
          <input v-else type="tel" v-model="editableProfile.phoneNumber" class="mt-1 block w-full p-2 border border-blue-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
        </div>
        <div class="transition-all duration-300 hover:bg-blue-50 p-3 rounded-lg"><strong class="text-blue-700">💼 Povolanie:</strong>
          <p v-if="!isEditing" class="mt-1 text-gray-800">{{ editableProfile.occupation || 'Neuvedené' }}</p>
          <input v-else type="text" v-model="editableProfile.occupation" class="mt-1 block w-full p-2 border border-blue-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
        </div>
        <div class="col-span-full transition-all duration-300 hover:bg-blue-50 p-3 rounded-lg"><strong class="text-blue-700">👶 Deti:</strong>
          <p v-if="!isEditing" class="mt-1 text-gray-800">{{ editableProfile.childrenStatus || 'Neuvedené' }}</p>
          <select v-else v-model="editableProfile.childrenStatus" class="mt-1 block w-full p-2 border border-blue-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option>Nemám deti</option>
            <option>Deti ma budú navštevovať</option>
            <option>Deti budú bývať so mnou</option>
          </select>
        </div>
        <div class="col-span-full md:col-span-1 transition-all duration-300 hover:bg-blue-50 p-3 rounded-lg"><strong class="text-blue-700">🏠 Práca/Štúdium z Domu?</strong>
          <p v-if="!isEditing" class="mt-1 text-gray-800">{{ editableProfile.workHome || 'Neuvedené' }}</p>
          <select v-else v-model="editableProfile.workHome" class="mt-1 block w-full p-2 border border-blue-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option>Áno</option>
            <option>Občas</option>
            <option>Nie</option>
          </select>
        </div>
        <div class="col-span-full transition-all duration-300 hover:bg-blue-50 p-3 rounded-lg"><strong class="text-blue-700">🧑‍🤝‍🧑 Hľadám s kamarátmi:</strong>
          <p v-if="!isEditing" class="mt-1 text-gray-800">{{ editableProfile.isGroup ? 'Áno' : 'Nie' }}</p>
          <select v-else v-model="editableProfile.isGroup" class="mt-1 block w-full p-2 border border-blue-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option :value="true">Áno</option>
            <option :value="false">Nie</option>
          </select>
        </div>
         <div v-if="(editableProfile.isGroup)" class="col-span-full transition-all duration-300 hover:bg-blue-50 p-3 rounded-lg"> <!-- Always use editableProfile here -->
           <strong class="text-blue-700">👥 Členovia skupiny:</strong>
           <div v-if="!isEditing && (!editableProfile.groupMembers || editableProfile.groupMembers.length === 0)" class="mt-1">
             <p class="text-gray-500 italic">Žiadni členovia skupiny neuvedení.</p>
           </div>
           <ul v-else-if="!isEditing && editableProfile.groupMembers && editableProfile.groupMembers.length > 0" class="list-disc pl-5 text-gray-800 mt-1">
             <li v-for="(member, idx) in editableProfile.groupMembers" :key="idx">{{ member }}</li>
           </ul>
           <div v-else-if="isEditing" class="space-y-2 mt-2">
             <div v-for="(member, index) in editableProfile.groupMembers || []" :key="index" class="flex items-center gap-2">
               <input
                 v-model="editableProfile.groupMembers[index]"
                 type="text"
                 placeholder="Meno člena skupiny"
                 class="flex-1 p-2 border border-blue-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
               />
               <button type="button" @click="removeGroupMember(index)" class="text-red-600 hover:text-red-800 font-semibold">🗑️ Odstrániť</button>
             </div>
             <button type="button" @click="addGroupMember" class="text-blue-600 hover:text-blue-800 font-semibold flex items-center mt-2 py-1 px-2 rounded border border-blue-500 hover:bg-blue-100">
               <span class="mr-1 text-lg">➕</span> Pridať člena
             </button>
              <p v-if="!editableProfile.groupMembers || editableProfile.groupMembers.length === 0" class="text-xs text-gray-500">Pridajte členov vašej skupiny.</p>
           </div>
         </div>
       </div>
     </div>

    <!-- Other Sections (Bio, Housing Needs, Lifestyle, etc.) remain the same -->
    <!-- ... Bio ... -->
    <div class="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-700">
      <h3 class="text-lg font-semibold mb-3 text-blue-800 flex items-center"><span class="mr-2">📝</span> Bio</h3>
      <p v-if="!isEditing" class="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{{ profile.bio || 'Bio nebolo poskytnuté.' }}</p>
      <textarea v-else v-model="editableProfile.bio" rows="5" class="mt-1 block w-full p-2 border border-blue-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 whitespace-pre-wrap text-sm leading-relaxed"></textarea>
    </div>

    <!-- ... Housing Needs ... -->
     <div class="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-700">
       <h3 class="text-lg font-semibold mb-3 text-blue-800 flex items-center"><span class="mr-2">🏘️</span> Požiadavky na Bývanie</h3>
       <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
         <div class="transition-all duration-300 hover:bg-blue-50 p-3 rounded-lg"><strong class="text-blue-700">📍 Požadovaná Lokalita:</strong>
           <p v-if="!isEditing" class="mt-1 text-gray-800">{{ profile.location || 'Neuvedená' }}</p>
           <LocationInput v-else v-model="location" @location-changed="handleLocationChange" class="mt-1" />
         </div>
         <div class="transition-all duration-300 hover:bg-blue-50 p-3 rounded-lg"><strong class="text-blue-700">💰 Rozpočet (€/mesiac):</strong>
           <p v-if="!isEditing" class="mt-1 text-gray-800">{{ profile.budget ? `${profile.budget} €` : 'Neuvedený' }}</p>
           <input v-else type="number" v-model.number="editableProfile.budget" placeholder="napr. 500" class="mt-1 block w-full p-2 border border-blue-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
         </div>
         <div class="transition-all duration-300 hover:bg-blue-50 p-3 rounded-lg"><strong class="text-blue-700">🗓️ Preferovaný Dátum Sťahovania:</strong>
           <p v-if="!isEditing" class="mt-1 text-gray-800">{{ profile.preferredMoveDate ? formatDate(profile.preferredMoveDate, true) : 'Flexibilný' }}</p>
           <input v-else type="date" :value="formatDateForInput(editableProfile.preferredMoveDate)" @input="editableProfile.preferredMoveDate = $event.target.value" class="mt-1 block w-full p-2 border border-blue-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
           <small v-if="isEditing && !editableProfile.preferredMoveDate" class="text-gray-500 block mt-1">Ponechajte prázdne pre flexibilný dátum.</small>
         </div>
         <div class="transition-all duration-300 hover:bg-blue-50 p-3 rounded-lg"><strong class="text-blue-700">🧑‍🤝‍🧑 Preferované Pohlavie (Spolubývajúci):</strong>
           <p v-if="!isEditing" class="mt-1 text-gray-800">{{ profile.preferredGender || 'Neuvedené' }}</p>
           <select v-else v-model="editableProfile.preferredGender" class="mt-1 block w-full p-2 border border-blue-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
             <option>Žiadna preferencia</option>
             <option>Muž</option>
             <option>Žena</option>
           </select>
         </div>
         <div class="transition-all duration-300 hover:bg-blue-50 p-3 rounded-lg"><strong class="text-blue-700">🎂 Preferovaný Vekový Rozsah (Spolubývajúci):</strong>
           <p v-if="!isEditing" class="mt-1 text-gray-800">{{ profile.preferredAgeRange || 'Neuvedený' }}</p>
           <input v-else type="text" v-model="editableProfile.preferredAgeRange" placeholder="napr. 20-30" class="mt-1 block w-full p-2 border border-blue-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
         </div>
       </div>
     </div>

    <!-- ... Lifestyle ... -->
    <div class="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-700">
       <h3 class="text-lg font-semibold mb-3 text-blue-800 flex items-center"><span class="mr-2">🧘</span> Životný Štýl</h3>
       <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
         <div class="transition-all duration-300 hover:bg-blue-50 p-3 rounded-lg"><strong class="text-blue-700">🚬 Fajčiar?</strong>
           <p v-if="!isEditing" class="mt-1 text-gray-800">{{ profile.isSmoker ? '💨 Áno' : '🚭 Nie' }}</p>
           <select v-else v-model="editableProfile.isSmoker" class="mt-1 block w-full p-2 border border-blue-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
             <option :value="true">Áno</option>
             <option :value="false">Nie</option>
           </select>
         </div>
         <div class="transition-all duration-300 hover:bg-blue-50 p-3 rounded-lg"><strong class="text-blue-700">✨ Úroveň Čistoty:</strong>
           <p v-if="!isEditing" class="mt-1 text-gray-800">
             {{ profile.cleanlinessLevel === 'Vždy je po mne poriadok' ? '🧼 ' :
                profile.cleanlinessLevel === 'Čistý v spoločných priestoroch' ? '🧹 ' :
                profile.cleanlinessLevel === 'Bordelár' ? '🤷 ' : '' }}
             {{ profile.cleanlinessLevel || 'Neuvedená' }}
           </p>
           <select v-else v-model="editableProfile.cleanlinessLevel" class="mt-1 block w-full p-2 border border-blue-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
             <option>Vždy je po mne poriadok</option>
             <option>Čistý v spoločných priestoroch</option>
             <option>Bordelár</option>
           </select>
         </div>
         <div class="transition-all duration-300 hover:bg-blue-50 p-3 rounded-lg"><strong class="text-blue-700">📅 Frekvencia upratovania:</strong>
           <p v-if="!isEditing" class="mt-1 text-gray-800">
             {{ profile.cleaningFrequency === 'Denne' ? '🧽 ' :
                profile.cleaningFrequency === 'Týždenne' ? '🧹 ' :
                profile.cleaningFrequency === 'Nie často' ? '🗓️ ' : '' }}
             {{ profile.cleaningFrequency || 'Neuvedená' }}
           </p>
           <select v-else v-model="editableProfile.cleaningFrequency" class="mt-1 block w-full p-2 border border-blue-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
             <option>Denne</option>
             <option>Týždenne</option>
             <option>Nie často</option>
           </select>
         </div>
         <div class="transition-all duration-300 hover:bg-blue-50 p-3 rounded-lg"><strong class="text-blue-700">🥂 Konzumácia alkoholu:</strong>
           <p v-if="!isEditing" class="mt-1 text-gray-800">
             {{ profile.alcoholUse === 'Pravidelne' ? '🍺 ' :
                profile.alcoholUse === 'Príležitostne' ? '🥂 ' :
                profile.alcoholUse === 'Vôbec' ? '🚫 ' : '' }}
             {{ profile.alcoholUse || 'Neuvedená' }}
           </p>
           <select v-else v-model="editableProfile.alcoholUse" class="mt-1 block w-full p-2 border border-blue-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
             <option>Pravidelne</option>
             <option>Príležitostne</option>
             <option>Vôbec</option>
           </select>
         </div>
         <div class="transition-all duration-300 hover:bg-blue-50 p-3 rounded-lg"><strong class="text-blue-700">🍳 Varenie:</strong>
           <p v-if="!isEditing" class="mt-1 text-gray-800">
             {{ profile.cookingFrequency === 'Áno, denne' ? '👨‍🍳 ' :
                profile.cookingFrequency === 'Občas' ? '🍳 ' :
                profile.cookingFrequency === 'Takmer vôbec' ? '🥡 ' : '' }}
             {{ profile.cookingFrequency || 'Neuvedené' }}
           </p>
           <select v-else v-model="editableProfile.cookingFrequency" class="mt-1 block w-full p-2 border border-blue-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
             <option>Áno, denne</option>
             <option>Občas</option>
             <option>Takmer vôbec</option>
           </select>
         </div>
         <div class="transition-all duration-300 hover:bg-blue-50 p-3 rounded-lg"><strong class="text-blue-700">🍽️ Stravovacie preferencie:</strong>
           <p v-if="!isEditing" class="mt-1 text-gray-800">
             {{ profile.dietaryPreference === 'Všežravec' ? '🍖 ' :
                profile.dietaryPreference === 'Vegetarián' ? '🥗 ' :
                profile.dietaryPreference === 'Vegán' ? '🌱 ' :
                profile.dietaryPreference === 'Špeciálne diéty / alergie' ? '⚠️ ' : '' }}
             {{ profile.dietaryPreference || 'Neuvedené' }}
           </p>
           <select v-else v-model="editableProfile.dietaryPreference" class="mt-1 block w-full p-2 border border-blue-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
             <option>Všežravec</option>
             <option>Vegetarián</option>
             <option>Vegán</option>
             <option>Špeciálne diéty / alergie</option>
           </select>
         </div>
       </div>
     </div>

    <!-- ... Sleep Patterns ... -->
    <div class="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-700">
       <h3 class="text-lg font-semibold mb-3 text-blue-800 flex items-center"><span class="mr-2">😴</span> Spánkový rytmus</h3>
       <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
         <div class="transition-all duration-300 hover:bg-blue-50 p-3 rounded-lg"><strong class="text-blue-700">🌙 Čas spánku:</strong>
           <p v-if="!isEditing" class="mt-1 text-gray-800">{{ profile.bedTime || 'Neuvedený' }}</p>
           <input v-else type="time" v-model="editableProfile.bedTime" class="mt-1 block w-full p-2 border border-blue-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
         </div>
         <div class="transition-all duration-300 hover:bg-blue-50 p-3 rounded-lg"><strong class="text-blue-700">🌅 Čas vstávania:</strong>
           <p v-if="!isEditing" class="mt-1 text-gray-800">{{ profile.wakeTime || 'Neuvedený' }}</p>
           <input v-else type="time" v-model="editableProfile.wakeTime" class="mt-1 block w-full p-2 border border-blue-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
         </div>
         <div class="md:col-span-2 transition-all duration-300 hover:bg-blue-50 p-3 rounded-lg"><strong class="text-blue-700">⏱️ Som skôr:</strong>
           <p v-if="!isEditing" class="mt-1 text-gray-800">
             {{ profile.dayPreference === 'Ranné vtáča' ? '🐦 ' :
                profile.dayPreference === 'Nočná sova' ? '🦉 ' :
                profile.dayPreference === 'Niečo medzi' ? '⏰ ' : '' }}
             {{ profile.dayPreference || 'Neuvedené' }}
           </p>
           <select v-else v-model="editableProfile.dayPreference" class="mt-1 block w-full p-2 border border-blue-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
             <option>Ranné vtáča</option>
             <option>Nočná sova</option>
             <option>Niečo medzi</option>
           </select>
         </div>
       </div>
     </div>

    <!-- ... Social Life ... -->
    <div class="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-700">
       <h3 class="text-lg font-semibold mb-3 text-blue-800 flex items-center"><span class="mr-2">🎭</span> Spoločenský život</h3>
       <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
         <div class="transition-all duration-300 hover:bg-blue-50 p-3 rounded-lg"><strong class="text-blue-700">🎉 Pozývanie hostí:</strong>
           <p v-if="!isEditing" class="mt-1 text-gray-800">
             {{ profile.guestFrequency === 'Často' ? '🥳 ' :
                profile.guestFrequency === 'Občas' ? '👥 ' :
                profile.guestFrequency === 'Takmer nikdy' ? '🧘 ' : '' }}
             {{ profile.guestFrequency || 'Neuvedené' }}
           </p>
           <select v-else v-model="editableProfile.guestFrequency" class="mt-1 block w-full p-2 border border-blue-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
             <option>Často</option>
             <option>Občas</option>
             <option>Takmer nikdy</option>
           </select>
         </div>
         <div class="transition-all duration-300 hover:bg-blue-50 p-3 rounded-lg"><strong class="text-blue-700">🔊 Tolerancia hluku:</strong>
           <p v-if="!isEditing" class="mt-1 text-gray-800">
             {{ profile.noiseTolerance === 'Vysoká' ? '📢 ' :
                profile.noiseTolerance === 'Stredná' ? '🔉 ' :
                profile.noiseTolerance === 'Nízka' ? '🔈 ' : '' }}
             {{ profile.noiseTolerance || 'Neuvedená' }}
           </p>
           <select v-else v-model="editableProfile.noiseTolerance" class="mt-1 block w-full p-2 border border-blue-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
             <option>Vysoká</option>
             <option>Stredná</option>
             <option>Nízka</option>
           </select>
         </div>
       </div>
     </div>

    <!-- ... Pets ... -->
     <div class="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-700">
       <h3 class="text-lg font-semibold mb-3 text-blue-800 flex items-center"><span class="mr-2">🐾</span> Domáce Zvieratá</h3>
       <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
         <div class="transition-all duration-300 hover:bg-blue-50 p-3 rounded-lg">
           <strong class="text-blue-700">🐶 Mám domáce zvieratá:</strong>
           <p v-if="!isEditing" class="mt-1 text-gray-800">{{ profile.hasPets ? '✅ Áno' : '❌ Nie' }}</p>
           <select v-else v-model="editableProfile.hasPets" class="mt-1 block w-full p-2 border border-blue-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
             <option :value="true">Áno</option>
             <option :value="false">Nie</option>
           </select>
         </div>
         <div v-if="profile.hasPets || (isEditing && editableProfile.hasPets)" class="transition-all duration-300 hover:bg-blue-50 p-3 rounded-lg">
           <strong class="text-blue-700">🐕 Pes:</strong>
           <p v-if="!isEditing" class="mt-1 text-gray-800">{{ profile.hasDog ? 'Áno' : 'Nie' }}</p>
           <select v-else v-model="editableProfile.hasDog" class="mt-1 block w-full p-2 border border-blue-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" :disabled="!(isEditing && editableProfile.hasPets)">
             <option :value="true">Áno</option>
             <option :value="false">Nie</option>
           </select>
         </div>
         <div v-if="profile.hasPets || (isEditing && editableProfile.hasPets)" class="transition-all duration-300 hover:bg-blue-50 p-3 rounded-lg">
           <strong class="text-blue-700">🐈 Mačka:</strong>
           <p v-if="!isEditing" class="mt-1 text-gray-800">{{ profile.hasCat ? 'Áno' : 'Nie' }}</p>
           <select v-else v-model="editableProfile.hasCat" class="mt-1 block w-full p-2 border border-blue-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" :disabled="!(isEditing && editableProfile.hasPets)">
             <option :value="true">Áno</option>
             <option :value="false">Nie</option>
           </select>
         </div>
       </div>
     </div>

    <!-- ... Education ... -->
     <div class="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-700">
       <h3 class="text-lg font-semibold mb-3 text-blue-800 flex items-center"><span class="mr-2">🎓</span> Vzdelanie</h3>
       <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
         <div class="col-span-full md:col-span-1 transition-all duration-300 hover:bg-blue-50 p-3 rounded-lg">
           <strong class="text-blue-700">🧑‍🎓 Som študent:</strong>
           <p v-if="!isEditing" class="mt-1 text-gray-800">{{ profile.student ? 'Áno' : 'Nie' }}</p>
           <select v-else v-model="editableProfile.student" class="mt-1 block w-full p-2 border border-blue-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
             <option :value="true">Áno</option>
             <option :value="false">Nie</option>
           </select>
         </div>
         <div v-if="profile.student || (isEditing && editableProfile.student)" class="col-span-full transition-all duration-300 hover:bg-blue-50 p-3 rounded-lg">
           <strong class="text-blue-700">🏛️ Škola:</strong>
           <p v-if="!isEditing" class="mt-1 text-gray-800">{{ profile.selectedSchool || 'Neuvedená' }}</p>
           <select
             v-else
             v-model="editableProfile.selectedSchool"
             @change="handleSchoolChange"
             class="mt-1 block w-full p-2 border border-blue-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
             :disabled="!(isEditing && editableProfile.student)"
           >
             <option value="">Vyberte školu</option>
             <option v-for="(faculties, school) in schools" :key="school" :value="school">{{ school }}</option>
           </select>
         </div>
         <div v-if="profile.student || (isEditing && editableProfile.student)" class="col-span-full transition-all duration-300 hover:bg-blue-50 p-3 rounded-lg">
           <strong class="text-blue-700">📚 Fakulta:</strong>
           <p v-if="!isEditing" class="mt-1 text-gray-800">{{ profile.selectedFaculty || 'Neuvedená' }}</p>
           <select
             v-else
             v-model="editableProfile.selectedFaculty"
             class="mt-1 block w-full p-2 border border-blue-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
             :disabled="!(isEditing && editableProfile.student) || !editableProfile.selectedSchool || availableFaculties.length === 0"
           >
             <option value="">Vyberte fakultu</option>
             <option v-for="faculty in availableFaculties" :key="faculty" :value="faculty">{{ faculty }}</option>
           </select>
         </div>
         <div v-if="profile.student || (isEditing && editableProfile.student)" class="col-span-full transition-all duration-300 hover:bg-blue-50 p-3 rounded-lg">
           <strong class="text-blue-700">📜 Študijný Program:</strong>
           <p v-if="!isEditing" class="mt-1 text-gray-800">{{ profile.studyProgram || 'Neuvedený' }}</p>
           <input v-else type="text" v-model="editableProfile.studyProgram" placeholder="Názov programu" class="mt-1 block w-full p-2 border border-blue-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" :disabled="!(isEditing && editableProfile.student)">
         </div>
       </div>
     </div>

    <!-- Meta Section -->
    <p v-if="profile.updatedAt && !isEditing" class="text-xs text-gray-600 text-center pt-4">
      Profil naposledy aktualizovaný: {{ formatDate(profile.updatedAt) }}
    </p>
  </div>
  <!-- Loading / No Profile State -->
  <div v-else-if="!profile" class="text-gray-500 p-8 text-center text-lg">⏳ Načítavajú sa údaje profilu alebo profil neexistuje...</div>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits, computed } from 'vue';

import { formatDate } from '~/utils/formatters';
import schools from '~/src/data/schools.json';
import { useToast } from 'vue-toastification';
import LocationInput from '~/components/LocationInput.vue';
import ProfileImageChanger from '~/components/ProfileImageChanger.vue'; // Ensure correct import

const props = defineProps({
  profile: {
    type: Object,
    required: false,
    default: null
  }
});

const emit = defineEmits(['update-profile', 'update-profile-image']);

const isEditing = ref(false); // For non-image fields
const editableProfile = ref(null);
const toast = useToast();
const isSavingProfile = ref(false); // For non-image fields save button
const defaultAvatarUrl = ref('/img/default-avatar.png');

const location = ref('');
const zip = ref('');
const geo = ref(null);

const availableFaculties = computed(() => {
  if (!editableProfile.value?.student || !editableProfile.value.selectedSchool) return [];
  return schools[editableProfile.value.selectedSchool] || [];
});

function extractStoragePathFromUrl(url) {
  if (!url) return null;
  try {
    const urlObject = new URL(url);
    const pathEncoded = urlObject.pathname.split('/o/')[1];
    if (!pathEncoded) return null;
    const pathWithoutQuery = pathEncoded.split('?')[0];
    return decodeURIComponent(pathWithoutQuery);
  } catch (error) { return null; }
}

const onImageError = (event) => {
  event.target.src = defaultAvatarUrl.value;
};

const formatDateForInput = (dateStringOrTimestamp) => {
  if (!dateStringOrTimestamp) return '';
  const date = (typeof dateStringOrTimestamp?.toDate === 'function') ? dateStringOrTimestamp.toDate() : new Date(dateStringOrTimestamp);
  if (isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
};

const handleSchoolChange = () => { if (editableProfile.value) editableProfile.value.selectedFaculty = ''; };
const addGroupMember = () => {
  if (editableProfile.value) {
    if (!Array.isArray(editableProfile.value.groupMembers)) editableProfile.value.groupMembers = [];
    editableProfile.value.groupMembers.push('');
  }
};
const removeGroupMember = (index) => {
  if (editableProfile.value?.groupMembers) editableProfile.value.groupMembers.splice(index, 1);
};
function handleLocationChange(locationData) {
  location.value = locationData.address || '';
  zip.value = locationData.zipCode || '';
  geo.value = (locationData.lat !== undefined && locationData.lng !== undefined) ? { lat: locationData.lat, lng: locationData.lng } : null;
}

watch(() => props.profile, (newProfile) => {
  if (newProfile) {
    const freshCopy = JSON.parse(JSON.stringify(newProfile));
    if (!Array.isArray(freshCopy.images)) freshCopy.images = [];
    if (freshCopy.avatarStoragePath === undefined) {
        freshCopy.avatarStoragePath = extractStoragePathFromUrl(freshCopy.images[0]);
    }
    if (freshCopy.isGroup && !Array.isArray(freshCopy.groupMembers)) freshCopy.groupMembers = [];
    else if (!freshCopy.isGroup) freshCopy.groupMembers = [];
    editableProfile.value = freshCopy;
    location.value = editableProfile.value.location || '';
    zip.value = editableProfile.value.zipCode || '';
    const coords = editableProfile.value.coordinates;
    if (coords) {
        if (coords.latitude !== undefined && coords.longitude !== undefined) geo.value = { lat: coords.latitude, lng: coords.longitude };
        else if (Array.isArray(coords) && coords.length === 2) geo.value = { lat: coords[0], lng: coords[1] };
        else if (coords.lat !== undefined && coords.lng !== undefined) geo.value = { lat: coords.lat, lng: coords.lng };
        else geo.value = null;
    } else geo.value = null;
  } else {
    editableProfile.value = null;
    location.value = ''; zip.value = ''; geo.value = null;
  }
}, { deep: true, immediate: true });

// --- Event Handler for Immediate Image Update ---
function handleImageUpdateConfirmed(imageData) {
  console.log('UserProfileDisplay received image-update-confirmed:', imageData);
  if (props.profile) { // Use props.profile to ensure we have the latest saved state as base
      const updatedImageData = {
          images: [imageData.url],
          avatarStoragePath: imageData.path
      };
      // Emit for immediate save by grandparent
      emit('update-profile-image', updatedImageData);
      toast.success('Profilový obrázok sa aktualizuje...');

      // Optimistically update local editableProfile as well for immediate visual feedback
      // This assumes the grandparent will successfully save and prop will update
      if (editableProfile.value) {
          editableProfile.value.images = [imageData.url];
          editableProfile.value.avatarStoragePath = imageData.path;
      }
  } else {
      toast.error("Chyba: Profil nebol nájdený pre aktualizáciu obrázka.");
  }
}

// --- Edit Mode Control for NON-IMAGE data ---
function startEditingNonImageData() {
  if (props.profile && editableProfile.value) {
    // Ensure editableProfile is based on the LATEST props.profile,
    // especially after an image might have been updated.
    editableProfile.value = JSON.parse(JSON.stringify(props.profile));
    // Re-initialize location refs for editing, based on the now fresh editableProfile
    location.value = editableProfile.value.location || '';
    zip.value = editableProfile.value.zipCode || '';
    const coords = editableProfile.value.coordinates;
    if (coords) {
        if (coords.latitude !== undefined && coords.longitude !== undefined) geo.value = { lat: coords.latitude, lng: coords.longitude };
        else if (Array.isArray(coords) && coords.length === 2) geo.value = { lat: coords[0], lng: coords[1] };
        else if (coords.lat !== undefined && coords.lng !== undefined) geo.value = { lat: coords.lat, lng: coords.lng };
        else geo.value = null;
    } else geo.value = null;

    isEditing.value = true;
  } else {
    toast.error("Profilové dáta nie sú pripravené na úpravu.");
  }
}

function cancelNonImageDataEditing() {
   if (props.profile) {
      // Revert editableProfile to the latest props.profile state
      editableProfile.value = JSON.parse(JSON.stringify(props.profile));
      location.value = editableProfile.value.location || '';
      zip.value = editableProfile.value.zipCode || '';
      const coords = editableProfile.value.coordinates;
       if (coords) {
           if (coords.latitude !== undefined && coords.longitude !== undefined) geo.value = { lat: coords.latitude, lng: coords.longitude };
           else if (Array.isArray(coords) && coords.length === 2) geo.value = { lat: coords[0], lng: coords[1] };
           else if (coords.lat !== undefined && coords.lng !== undefined) geo.value = { lat: coords.lat, lng: coords.lng };
           else geo.value = null;
       } else geo.value = null;
   } else {
       editableProfile.value = null;
       location.value = ''; zip.value = ''; geo.value = null;
   }
  isEditing.value = false;
}

// --- Save ONLY Non-Image Data ---
function saveNonImageData() {
  if (!editableProfile.value) {
    toast.error("Chyba: Dáta profilu nie sú k dispozícii.");
    return;
  }
  isSavingProfile.value = true;
  try {
    // --- Prepare and Clean Other Profile Data ---
    if (editableProfile.value.preferredMoveDate === '') editableProfile.value.preferredMoveDate = null;
    const booleanFields = ['isSmoker', 'hasPets', 'hasDog', 'hasCat', 'student', 'isGroup'];
    booleanFields.forEach(field => {
      const value = editableProfile.value[field];
      if (typeof value === 'string') editableProfile.value[field] = value === 'true';
      else if (value === undefined || value === null) editableProfile.value[field] = false;
    });
    if (!editableProfile.value.student) { editableProfile.value.selectedSchool = ''; editableProfile.value.selectedFaculty = ''; editableProfile.value.studyProgram = ''; }
    else if (!editableProfile.value.selectedSchool) { editableProfile.value.selectedFaculty = ''; }
    if (!editableProfile.value.isGroup) { editableProfile.value.groupMembers = []; }
    else { editableProfile.value.groupMembers = (editableProfile.value.groupMembers || []).map(m => typeof m === 'string' ? m.trim() : '').filter(member => member !== ''); }
    if (!editableProfile.value.hasPets) { editableProfile.value.hasDog = false; editableProfile.value.hasCat = false; }
    editableProfile.value.location = location.value || '';
    editableProfile.value.zipCode = zip.value || '';
    if (geo.value) { editableProfile.value.coordinates = { latitude: geo.value.lat, longitude: geo.value.lng }; }
    else { editableProfile.value.coordinates = null; }

    // Create a clone of editableProfile, ensuring image data is from the original `props.profile`
    // or the latest image update, NOT potentially stale data in `editableProfile` if image was changed
    // since `startEditingNonImageData` was called.
    const dataToEmit = JSON.parse(JSON.stringify(editableProfile.value));

    // Ensure the image data in the emitted payload is the most current one from props.profile
    // (which would have been updated by the grandparent after an image change)
    if (props.profile.images) {
        dataToEmit.images = JSON.parse(JSON.stringify(props.profile.images));
    } else {
        dataToEmit.images = [];
    }
    if (props.profile.avatarStoragePath) {
        dataToEmit.avatarStoragePath = props.profile.avatarStoragePath;
    } else {
        delete dataToEmit.avatarStoragePath;
    }


    console.log("Emitting update-profile (non-image data merged with current image):", dataToEmit);
    emit('update-profile', dataToEmit);

    isEditing.value = false;
    toast.success("Detaily profilu uložené!");
  } catch (error) {
    console.error("Error during saveNonImageData:", error);
    toast.error(`Nastala chyba pri ukladaní detailov: ${error.message}`);
  } finally {
    isSavingProfile.value = false;
  }
}

</script>

<style scoped>
img { background-color: #e5e7eb; }
input:disabled, select:disabled, textarea:disabled { background-color: #f3f4f6; cursor: not-allowed; opacity: 0.7; }
input[type="date"]::-webkit-calendar-picker-indicator, input[type="time"]::-webkit-calendar-picker-indicator { cursor: pointer; opacity: 0.6; transition: opacity 0.2s ease-in-out; }
input[type="date"]::-webkit-calendar-picker-indicator:hover, input[type="time"]::-webkit-calendar-picker-indicator:hover { opacity: 1; }
</style>