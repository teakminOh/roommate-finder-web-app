<template>
  <div class="flex h-screen">
    <!-- Left: Listings -->
    <div class="w-1/2 p-4 overflow-y-auto bg-gray-100">
      <RoommateList />
    </div>

    <!-- Right: Map -->
    <div class="w-1/2 bg-gray-200">
      <Map />
    </div>
  </div>
</template>

<script lang="ts" setup>
import RoommateList from '~/components/users/RoommateList.vue';
// Define the page meta
definePageMeta({
  layout: "buy",
});

</script>

<style scoped>
/* Add custom styles if needed */
</style>
