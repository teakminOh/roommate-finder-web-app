<template>
  <input
    ref="locationInput"
    type="text"
    :value="modelValue"
    @input="onInput"
    placeholder="Lokalita (napr. Bratislava 851 01)"
    class="w-full px-3 py-2 border rounded-lg"
  />
</template>

<script setup lang="ts">
import { useLocationInput } from '@/composables/useLocationInput'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'location-changed', payload: { address: string; zipCode: string; lat: number; lng: number }): void
}>()

const { locationInput } = useLocationInput(emit)

function onInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>
