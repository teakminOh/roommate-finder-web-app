import type { FirestoreCompatibleDate, FirestoreCompatibleGeoPoint } from '~/types/listing'; // Ensure these are exported from listing.ts

export interface Roommate { // This interface should match your Firestore 'users' document structure
  id: string;                 // Firestore document ID (usually user's UID)
  uid?: string;                // Often same as id, Firebase Auth UID if you store it explicitly

  // Fields directly from your Firestore example:
  age: number;                // It's a number in Firestore
  alcoholUse: string;
  bedTime: string;
  bio: string;
  budget: number;             // It's a number in Firestore - EXCELLENT for filtering!
  childrenStatus: string;
  cleaningFrequency: string;
  cleanlinessLevel: string;
  completedProfile: boolean;
  cookingFrequency: string;
  coordinates: string; // Firestore GeoPoint
  dayPreference: string;
  dietaryPreference: string;
  email: string;
  firstName: string;
  gender: string;
  groupMembers: any[];        // Or define a specific type if you have a structure
  guestFrequency: string;
  hasCat: boolean;
  hasDog: boolean;
  hasOtherPets: boolean;
  hasPets: boolean;           // This seems redundant if you have hasCat/Dog/OtherPets, but include if it exists
  images: string[];           // Array of image URLs
  isGroup: boolean;
  isSmoker: boolean;
  livingArrangement: string;
  location: string;           // User's current or general location, or desired location for roommate ad
  noiseTolerance: string;
  occupation: string;
  phoneNumber?: string;        // Optional, as it might not always be present
  preferredAgeRange: string;  // e.g., "30-60"
  preferredGender: string;
  preferredMoveDate: string;  // e.g., "2025-04-04", consider parsing to Date if needed for logic
  selectedFaculty: string;
  selectedSchool: string;
  student: boolean;
  studyProgram: string;
  updatedAt: FirestoreCompatibleDate; // Firestore Timestamp
  wakeTime: string;
  workHome: string;
  zip?: string;                // Optional, as it was empty
}