// ~/types/listing.ts
import type { Timestamp as FirestoreTimestamp, GeoPoint as FirestoreGeoPoint } from 'firebase/firestore'; // Client-side types
import type { Room as OriginalRoom } from '~/types/room'; // Your Room.ts
import type { Roommate as OriginalRoommate } from '~/types/user'; // Your user.ts

export type ListingType = 'room' | 'roommateAd'; // Define your listing types

// Helper to represent what's actually stored in Firestore for dates and geo
// If you are already getting JS Date and a simple geo object from your types, adjust accordingly
export type FirestoreCompatibleDate = FirestoreTimestamp | Date | string;
export type FirestoreCompatibleGeoPoint = FirestoreGeoPoint | { latitude: number; longitude: number };


export interface BaseListing {
  id: string;
  listingType: ListingType;
  updatedAtNormalized: number; // For sorting (JS timestamp)
  displayTitle: string;
  displayImage?: string;       // First image from the images array
  locationText?: string;     // Derived from Room.location or Roommate.location
  budgetDisplay?: string;    // For displaying budget, could be range or single value
  // Add any other truly common fields you might want at the top level
  // For example, if both have a primary 'description' or 'bio'
  // description?: string;
}

export interface RoomListing extends BaseListing {
  listingType: 'room';
  originalData: OriginalRoom; // Contains all fields from your Room.ts
  // specific quick access fields (optional, could get from originalData)
  propertyType: string;
  roomBudgetValue: number; // The actual budget number for rooms
}

export interface RoommateAdListing extends BaseListing {
  listingType: 'roommateAd';
  originalData: OriginalRoommate; // Contains all fields from your user.ts (Roommate)
  // specific quick access fields (optional, could get from originalData)
  roommateFirstName: string;
  roommateDesiredBudget?: number; // If you store their desired budget as a number for filtering
}

export type Listing = RoomListing | RoommateAdListing;

// --- Adjust your OriginalRoom and OriginalRoommate interfaces slightly for clarity ---
// It's good practice if your frontend types reflect what you expect after Firestore retrieval (e.g. Date for Timestamps)

// In ~/types/room.ts
export interface Room {
  id: string; // Firestore document ID
  propertyType: string;
  aboutProperty: string;
  aboutRoomies: string;
  availableFrom: string; // Consider parsing to Date if used for date logic
  bathroomType: string;
  budget: number; // Good, it's a number
  location: string; // Descriptive location string
  images: string[]; // URLs
  coordinates?: FirestoreCompatibleGeoPoint; // Use client-side GeoPoint or {lat,lng}
  updatedAt: FirestoreCompatibleDate; // Will be converted to JS Date by Firestore SDK or normalizeDate
  zip: string;
  // Boolean flags...
  catFriendly: boolean;
  childrenFriendly: boolean;
  completedProfile: boolean;
  phoneNumber?: string;
  dogFriendly: boolean;
  email: string; // Usually owner's email or contact email for the room
  internetIncluded: boolean;
  isAccessible: boolean;
  isFurnished: boolean;
  isPrivateRoom: boolean;
  parkingAvailable: boolean;
  petsAllowed: boolean;
  preferredGender: string;
  rentWithBills: boolean;
  roomType: string;
  securityDeposit: number;
  studentsWelcome: boolean;
  ownerId?: string; // Good to have to link to the user who posted it
  // Add title if you have it, otherwise it will be constructed
  title?: string;
}

// In ~/types/user.ts (for Roommate)
export interface Roommate { // This is essentially a id: string;                 // Firestore document ID (usually user's UID)
  uid?: string;                // Often same as id, Firebase 
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
  coordinates: FirestoreCompatibleGeoPoint; // Firestore GeoPoint
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
  zip?: string;        
}