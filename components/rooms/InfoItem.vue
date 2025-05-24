<template>
  <div class="transition-all duration-300 hover:bg-teal-50 p-3 rounded-lg flex items-start">
    <span v-if="icon" class="mr-2 text-lg text-teal-600 pt-px">{{ icon }}</span>
    <div>
      <strong class="text-teal-700">{{ label }}:</strong>
      <p v-if="value !== null && value !== undefined && value !== ''" class="mt-1 text-gray-800">
        <a v-if="isLink" :href="isLink" target="_blank" rel="noopener noreferrer" class="hover:underline text-blue-600">{{ value }} {{ suffix }}</a>
        <span v-else>{{ value }} {{ suffix }}</span>
      </p>
      <p v-else class="mt-1 text-gray-500 italic">{{ defaultValue }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  icon: String,
  label: String,
  value: [String, Number, Boolean],
  suffix: {
    type: String,
    default: ''
  },
  defaultValue: {
    type: String,
    default: 'Neuvedené'
  },
  isLink: { // Pass a URL string here if value should be a link
      type: String,
      default: null
  }
});
</script>