// maps.d.ts (when @types/google.maps is installed)
declare global {
  interface Window {
    google: typeof google; // The 'google' namespace itself
    initAutocomplete?: () => void;
    onGoogleMapsReady?: () => void;
  }
}

export {}; // Ensures this is treated as a module