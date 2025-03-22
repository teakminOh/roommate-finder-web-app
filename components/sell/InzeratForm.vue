<template>
  <div class="flex flex-col gap-4">
    <label for="title">Názov
      <input 
        type="text" 
        id="title"
        v-model="form.title" 
        placeholder="Názov (napr. NOVO zariadený 2-IZB BYT)" 
        class="w-full px-3 py-2 border rounded-lg"
      />
     </label>

    <label for="fullDescription">Popis
      <textarea 
        id="fullDescription"
        v-model="form.fullDescription" 
        placeholder="Popis" 
        class="w-full px-3 py-2 border rounded-lg h-32"
      ></textarea>
    </label>    

    <label for="location">Lokalita
      <input 
        type="text" 
        id="location"
        v-model="form.location" 
        placeholder="Lokalita (napr. Bratislava 851 01)" 
        class="w-full px-3 py-2 border rounded-lg"
      />
    </label>
    <label for="phoneNumber">Telefónne číslo
      <input 
        type="text" 
        id="phoneNumber"
        v-model="form.phoneNumber" 
        placeholder="Telefónne číslo (napr. 0903599600)" 
        class="w-full px-3 py-2 border rounded-lg"
      />
    </label>
    <label for="price">Cena
    <input 
      type="text" 
      id="price"
      v-model="form.price" 
      placeholder="Cena (napr. 700 €)" 
      class="w-full px-3 py-2 border rounded-lg"
    />  
    </label>
    <label for="saleType">Typ predaja
    <select 
      id="saleType"
      v-model="form.saleType" 
      class="px-3 py-2 border rounded-lg"
    >
      <option value="sale">Predaj</option>
      <option value="rent">Prenájom</option>
    </select>
    </label>
  </div>
</template>

<script setup>
import { reactive } from 'vue'

// Define form data as reactive
const form = reactive({
  link: '',
  date: '',
  fullDescription: '',
  location: '',
  phoneNumber: '',
  price: '',
  saleType: '',
  title: '',
})

// Expose form data to parent
defineExpose({ form })
</script>