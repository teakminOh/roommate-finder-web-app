import { ref, onMounted } from 'vue'

export function useLocationInput(emit) {
  const locationInput = ref(null)

  onMounted(() => {
    if (locationInput.value && window.google) {
      const autocomplete = new google.maps.places.Autocomplete(locationInput.value, {
        types: ['geocode'],
        componentRestrictions: { country: 'sk' },
      })

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        if (place && place.address_components && place.geometry && place.geometry.location) {
          const postalCodeComponent = place.address_components.find(component =>
            component.types.includes('postal_code')
          )

          const formattedAddress = place.formatted_address || ''
          const lat = place.geometry.location.lat()
          const lng = place.geometry.location.lng()

          // v-model-like update
          emit('update:modelValue', formattedAddress)

          // Emit full data including coordinates
          emit('location-changed', {
            address: formattedAddress,
            zipCode: postalCodeComponent ? postalCodeComponent.long_name : '',
            lat,
            lng,
          })
        }
      })
    }
  })

  return { locationInput }
}
