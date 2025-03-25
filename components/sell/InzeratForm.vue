<template>
  <div class="space-y-4">
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
    
    <LocationInput v-model="form.location" @location-changed="handleLocationChange" />

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

<script setup lang="ts">
import LocationInput from '~/components/LocationInput.vue'
import { reactive } from 'vue'

const form = reactive({
  link: '',
  date: new Date().toISOString(),
  fullDescription: '',
  location: '',
  zipCode: '',  // New field for ZIP code
  phoneNumber: '',
  price: '',
  saleType: '',
  title: '',
})

defineExpose({ form })

function handleLocationChange({ address, zipCode }: { address: string; zipCode: string }) {
  // Update your form data using the formatted address
  form.location = address;
  form.zipCode = zipCode;
  console.log('New location:', address, 'ZIP:', zipCode);
}

</script>


