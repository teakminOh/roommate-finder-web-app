<template>
  <input
    ref="locationInput"
    type="text"
    :value="modelValue"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    placeholder="Lokalita (napr. Bratislava 851 01)"
    class="w-full px-3 py-2 border rounded-lg"
  />
</template>

<script setup lang="ts">
import { useLocationInput } from '@/composables/useLocationInput'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits(['update:modelValue', 'location-changed'])

const { locationInput } = useLocationInput(emit)
</script>
