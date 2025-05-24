<template>
  <div class="transition-all duration-300 hover:bg-teal-50 p-3 rounded-lg flex items-start">
    <span v-if="icon && (!showLabelOnlyIfEditing || isEditing)" class="mr-2 text-lg text-teal-600 pt-px">{{ icon }}</span>
    <div class="w-full">
      <strong v-if="!showLabelOnlyIfEditing || isEditing" class="text-teal-700 block mb-1">{{ label }}</strong>

      <!-- Display Mode -->
      <p v-if="!isEditing" class="text-gray-800">
        <a v-if="isLinkResult" :href="isLinkResult" target="_blank" rel="noopener noreferrer" class="hover:underline text-blue-600">
          {{ displayValue }} {{ suffix }}
        </a>
        <span v-else>{{ displayValue }} {{ suffix }}</span>
      </p>

      <!-- Edit Mode -->
      <template v-else>
        <input
          v-if="inputType === 'text' || inputType === 'number' || inputType === 'email' || inputType === 'tel' || inputType === 'date'"
          :type="inputType"
          :value="inputType === 'date' && formatter ? formatter(modelValue) : modelValue"
          @input="$emit('update:modelValue', inputType === 'number' ? Number($event.target.value) : $event.target.value)"
          class="mt-1 block w-full p-2 border border-teal-300 rounded-md shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
          :placeholder="isOptional ? '(Nepovinné)' : ''"
          :disabled="disabled"
        />
        <input
          v-else-if="inputType === 'checkbox'"
          type="checkbox"
          :checked="modelValue"
          @change="$emit('update:modelValue', $event.target.checked)"
          :disabled="disabled"
          class="mt-1 h-5 w-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
        />
        <select
          v-else-if="options && options.length"
          :value="modelValue"
          @change="$emit('update:modelValue', $event.target.value)"
          class="mt-1 block w-full p-2 border border-teal-300 rounded-md shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm bg-white"
          :disabled="disabled"
        >
          <option value="" :disabled="!isOptional">
            {{ isOptional && !modelValue ? 'Vyberte (Nepovinné)...' : 'Vyberte...' }}
          </option>
          <option v-for="option in options" :key="option" :value="option === 'Bez preferencie' && inputType === 'select' ? '' : option">
            {{ option }}
          </option>
        </select>
        <textarea
            v-else-if="inputType === 'textarea'"
            :value="modelValue"
            @input="$emit('update:modelValue', $event.target.value)"
            rows="4"
            class="mt-1 block w-full p-2 border border-teal-300 rounded-md shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
            :placeholder="isOptional ? '(Nepovinné)' : ''"
            :disabled="disabled"
        ></textarea>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  icon: String,
  label: String,
  modelValue: [String, Number, Boolean, Date, Object], // Allow Object for things like coordinates if needed directly
  isEditing: Boolean,
  inputType: {
    type: String,
    default: 'text' // text, number, email, tel, date, checkbox, select, textarea
  },
  options: Array,
  suffix: { type: String, default: '' },
  defaultValue: { type: String, default: 'Neuvedené' },
  formatter: Function, // For formatting modelValue for input (e.g., date to YYYY-MM-DD)
  displayFormatter: Function, // For formatting modelValue for display (e.g., date to DD.MM.YYYY)
  isOptional: { type: Boolean, default: false },
  showLabelOnlyIfEditing: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false }
});

defineEmits(['update:modelValue']);

const displayValue = computed(() => {
  if (props.displayFormatter) {
    return props.displayFormatter(props.modelValue);
  }
  if (props.modelValue === null || props.modelValue === undefined || props.modelValue === '') {
    if (props.inputType === 'checkbox') return props.defaultValue; // For checkbox, an empty value might mean "Nie"
    return props.isOptional && !props.modelValue ? '(Nepovinné)' : props.defaultValue;
  }
  if (typeof props.modelValue === 'boolean') {
    return props.modelValue ? 'Áno' : 'Nie';
  }
  return props.modelValue;
});

const isLinkResult = computed(() => {
    if (!props.isEditing && props.inputType === 'email' && props.modelValue) return `mailto:${props.modelValue}`;
    if (!props.isEditing && props.inputType === 'tel' && props.modelValue) return `tel:${props.modelValue}`;
    return null;
});
</script>