import { ref, onMounted } from 'vue';

export function useLocationInput(emit) {
  const locationInput = ref(null);

  onMounted(() => {
    if (locationInput.value && window.google) {
      const autocomplete = new google.maps.places.Autocomplete(locationInput.value, {
        types: ['geocode'],
        componentRestrictions: { country: 'sk' },
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place && place.address_components) {
          const postalCodeComponent = place.address_components.find(component =>
            component.types.includes('postal_code')
          );
          const formattedAddress = place.formatted_address || '';

          // Emit events back to the component
          emit('update:modelValue', formattedAddress);
          emit('location-changed', {
            address: formattedAddress,
            zipCode: postalCodeComponent ? postalCodeComponent.long_name : '',
          });
        }
      });
    }
  });

  return { locationInput };
}
