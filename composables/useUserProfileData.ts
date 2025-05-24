// composables/useUserProfileData.ts
import { computed } from 'vue';
import { useCurrentUser, useFirestore, useDocument } from 'vuefire';
import { doc } from 'firebase/firestore';

// Define a simple interface for the user profile data we need
interface UserProfile {
  id: string;
  displayName?: string; // Good to have for initials fallback
  photoURL?: string;    // Standard Firebase Auth field name
  profileImageUrl?: string; // Alternative common name
  images?: string[]; // If profile images are stored in an array
  // ... other profile fields you might have
}

export function useUserProfileData() {
  const currentUser = useCurrentUser(); // Renamed from 'user' to avoid conflict if you import 'user' from userContext
  const db = useFirestore();

  const userProfileDocRef = computed(() => {
    if (currentUser.value?.uid) {
      return doc(db, 'users', currentUser.value.uid); // Path to user's profile document
    }
    return null;
  });

  // Fetch the user's profile document
  const { data: userProfile, pending: userProfilePending, error: userProfileError } = useDocument<UserProfile>(userProfileDocRef);

  const profilePictureUrl = computed(() => {
    if (userProfile.value) {
      if (userProfile.value.photoURL) return userProfile.value.photoURL;
      if (userProfile.value.profileImageUrl) return userProfile.value.profileImageUrl;
      if (userProfile.value.images && userProfile.value.images.length > 0) {
        return userProfile.value.images[0]; // Take the first image from the array
      }
    }
    return null; // No profile picture URL found
  });

  const userDisplayName = computed(() => userProfile.value?.displayName || currentUser.value?.displayName || '');

  const userInitials = computed(() => {
    const name = userDisplayName.value;
    if (!name) return currentUser.value?.email?.charAt(0).toUpperCase() || '?';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    if (parts.length > 1) return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    return '?';
  });


  return {
    currentUser, // The raw Firebase Auth user
    userProfile, // The fetched profile data from Firestore
    userProfilePending,
    userProfileError,
    profilePictureUrl,
    userInitials, // Keep initials as a fallback or for when image fails to load
    userDisplayName
  };
}