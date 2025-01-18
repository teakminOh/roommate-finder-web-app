<template>
  <ul>
    <PropertyItem
      v-for="property in properties"
      :key="property._id"
      :property="property"
    />
  </ul>
</template>

<script setup>
// import PropertyItem from '~/components/PropertyItem.vue';

defineProps({
  properties: {
    type: Array,
    required: true,
  },
});
</script>

<style scoped>
/* Add your styles here */
</style>
