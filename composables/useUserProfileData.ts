// composables/useUserProfileData.ts
import { computed } from 'vue';
import { useCurrentUser, useFirestore, useDocument } from 'vuefire';
import { doc } from 'firebase/firestore';
import { useUserContext } from '~/composables/useUserContext'; // Import useUserContext
import type { Room } from '~/types/room'; // Import your Room type

// Interface for the profile data specifically from the 'users' collection
interface UserProfileInUsersCollection {
  id: string;
  displayName?: string;
  images?: string[];
  // ... other profile fields you might have in 'users' collection
}

export function useUserProfileData() {
  const currentUser = useCurrentUser();
  const db = useFirestore();

  // Get data from useUserContext, specifically the user's room document.
  // userRoom will be the document from 'rooms/{uid}'
  const { userRoom } = useUserContext(); // Removed 'hasListedRoom' as it's not directly used here, but userRoom implies its existence if non-null.

  const userProfileDocRef = computed(() => {
    if (currentUser.value?.uid) {
      return doc(db, 'users', currentUser.value.uid); // Path to user's profile in 'users'
    }
    return null;
  });

  // Fetch the user's profile document from the 'users' collection
  const {
    data: profileFromUsersCollection, // Data from 'users/{uid}'
    pending: userProfilePending,
    error: userProfileError
  } = useDocument<UserProfileInUsersCollection>(userProfileDocRef);

  const profilePictureUrl = computed(() => {
    // Priority 1: From the user's profile document in 'users' collection
    if (profileFromUsersCollection.value?.images && profileFromUsersCollection.value.images.length > 0) {
      return profileFromUsersCollection.value.images[0];
    }

    // Priority 2: From the user's document in 'rooms' collection
    // userRoom.value comes from useUserContext, which fetches doc(db, 'rooms', currentUser.value.uid)
    if (userRoom.value) {
      const roomData = userRoom.value as Room; // Cast to your Room type
      // Ensure your Room type has an 'images' field (string[])
      if (roomData.images && roomData.images.length > 0) {
        return roomData.images[0]; // Take the first image from the room's images array
      }
    }

    // Priority 3: Fallback to Firebase Auth user's photoURL
    if (currentUser.value?.photoURL) {
        return currentUser.value.photoURL;
    }

    return null; // No profile picture URL found
  });

  const userDisplayName = computed(() => {
    // Priority 1: From 'users' collection profile's displayName
    if (profileFromUsersCollection.value?.displayName) {
      return profileFromUsersCollection.value.displayName;
    }

    // Priority 2: From 'rooms' collection document.
    // Your current code uses 'email' from the roomData.
    // If you intend to use the room's 'name', change roomData.email to roomData.name.
    // Ensure your Room type has the relevant field ('email' or 'name').
    if (userRoom.value) {
      const roomData = userRoom.value as Room;
      if (roomData.email) { // Using room's 'email' as display name
        return roomData.email;
      }
      // Example: if you wanted to use room's 'name' instead:
      // if (roomData.name) {
      //   return roomData.name;
      // }
    }

    // Priority 3: From Firebase Auth user's displayName
    if (currentUser.value?.displayName) {
      return currentUser.value.displayName;
    }
    
    // Priority 4 (Implicit in userInitials, but can be explicit here too): User's email from Auth
    if (currentUser.value?.email) {
        return currentUser.value.email;
    }

    return ''; // Default to empty string
  });

  const userInitials = computed(() => {
    const name = userDisplayName.value;
    // If userDisplayName ended up being an empty string, but we have an email from Auth.
    if (!name && currentUser.value?.email) {
      return currentUser.value.email.charAt(0).toUpperCase();
    }
    if (!name) return '?'; // If still no name (and no email), return '?'

    const parts = name.split(' ').filter(Boolean); // filter(Boolean) removes empty strings if there are multiple spaces
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    if (parts.length > 1) return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    return '?'; // Fallback for any other case (e.g., name is present but not parsable by above logic)
  });


  return {
    currentUser,
    userProfile: profileFromUsersCollection, // The fetched profile data from 'users' collection
    userProfilePending,
    userProfileError,
    profilePictureUrl,
    userInitials,
    userDisplayName
  };
}