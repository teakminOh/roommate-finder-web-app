<template>
  <div 
    :class="[
      'flex items-center p-3 rounded-lg', 
      active ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-400'
    ]"
  >
    <span class="text-xl mr-2">{{ icon }}</span>
    <span :class="{ 'font-medium': active }">{{ label }}</span>
    <svg 
      v-if="active"
      xmlns="http://www.w3.org/2000/svg" 
      class="h-5 w-5 ml-auto text-green-600" 
      viewBox="0 0 20 20" 
      fill="currentColor"
    >
      <path 
        fill-rule="evenodd" 
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
        clip-rule="evenodd" 
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
defineProps({
  active: {
    type: Boolean,
    default: false
  },
  icon: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  }
});
</script>