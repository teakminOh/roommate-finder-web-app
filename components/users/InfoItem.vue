<template>
  <span class="inline-flex items-center space-x-1 text-sm text-gray-700">
    <span class="mr-1 font-bold">{{ emoji }} <span class="font-semibold">{{ label }}</span></span>
  </span>
</template>

<script setup lang="ts">
defineProps<{
  emoji: string;
  label: string;
}>();
</script>