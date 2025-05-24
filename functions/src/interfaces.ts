import * as admin from "firebase-admin";

// --- Profile Interfaces (Expanded for Scoring) ---

export interface BaseProfile {
    id: string; // Document ID should always be present when processing
    location?: string; // Keep for display
    coordinates?: admin.firestore.GeoPoint; // Keep for radius check (often a hard filter or high weight)
    completedProfile: boolean;
    budget?: number; // Crucial for matching
}

export interface UserProfile extends BaseProfile {
    // User Specific Demographics & Preferences
    firstName?: string; // Good for display in matches
    age?: number;
    gender?: string; // e.g., "female", "male"
    preferredAgeRange?: string; // e.g., "20-26"
    preferredGender?: string; // e.g., "Žena", "Muž", "Nezáleží"
    preferredMoveDate?: string; // e.g., "2025-09-10"
    

    // Lifestyle & Habits
    isSmoker?: boolean;
    alcoholUse?: string; // "Príležitostne", "Nikdy", etc.
    cleanlinessLevel?: string; // "Vždy je po mne poriadok", etc.
    cleaningFrequency?: string; // "Týždenne", etc.
    cookingFrequency?: string; // "Takmer vôbec", etc.
    guestFrequency?: string; // "Občas", etc.
    noiseTolerance?: string; // "Stredná", etc.
    bedTime?: string; // "12:00"
    wakeTime?: string; // "09:00"
    workHome?: string; // "Áno", "Nie"
    dayPreference?: string; // "Ranné vtáča", "Nočná sova", "Niečo medzi" - Could compare similarity

    hasPets?: boolean; // Overall flag
    hasCat?: boolean;
    hasDog?: boolean;
    hasOtherPets?: boolean;
    // Might add: okWithPets?: boolean; okWithCats?: boolean; okWithDogs?: boolean; (User's tolerance)

    // Status
    student?: boolean;
    occupation?: string; // Could be used for filtering/info
    selectedSchool?: string; // Relevant if student
    selectedFaculty?: string; // Relevant if student
    studyProgram?: string; // Relevant if student
    childrenStatus?: string; // e.g., "no_children"

    // Room Preferences (User's perspective)
    livingArrangement?: string; // e.g., "individual", "shared" (maps to roomType/isPrivateRoom?)
    // Might add: wantsFurnished?: boolean; needsParking?: boolean; needsAccessible?: boolean;
}

export interface RoomProfile extends BaseProfile {
    // Room Specific Details
    propertyType?: string; // e.g., "Rodinný dom", "Byt"
    roomType?: string; // e.g., "Celý byt / dom", "Súkromná izba"
    isPrivateRoom?: boolean; // More specific than roomType perhaps?
    isFurnished?: boolean;
    isAccessible?: boolean;
    internetIncluded?: boolean;
    parkingAvailable?: boolean;
    bathroomType?: string; // e.g., "Súkromná kúpeľňa"

    // Availability & Cost (budget already in BaseProfile)
    availableFrom?: string; // e.g., "2025-04-01"
    // securityDeposit?: number; // Might be relevant info, less for matching score?
    // rentWithBills?: boolean; // Info, less for matching score?

    // Occupant Preferences (Room's perspective)
    preferredGender?: string; // "Žena", "Muž", "Nezáleží"
    // Might add: preferredAgeMin/Max?: number; preferredOccupation?: string;

    // Policies
    petsAllowed?: boolean;
    catFriendly?: boolean;
    dogFriendly?: boolean;
    // Might add: smokingPolicy?: "allowed" | "outside" | "forbidden";
    studentsWelcome?: boolean;
    childrenFriendly?: boolean;

    // Optional fields for context/display
    // aboutProperty?: string;
    // aboutRoomies?: string; // If owner lives there / other tenants
}


// --- Match Document Interfaces (Added Score) ---

export interface BaseMatch {
    updatedAt: admin.firestore.Timestamp | admin.firestore.FieldValue;
    score: number; // Essential: The calculated compatibility score
    distance:  number | null | undefined; // Optional: Still useful to store calculated distance
}

export interface UserUserMatch extends BaseMatch {
  type: "user-user";
  uids: [string, string]; // Sorted user IDs
  // Minimal display data (using your chosen structure)
  user1Loc?: string;
  user2Loc?: string;
  // Add user1Display/user2Display objects if you prefer that structure later
}

export interface UserRoomMatch extends BaseMatch {
  type: "user-room";
  userId: string;
  roomId: string;
  // Minimal display data (using your chosen structure)
  userLoc?: string;
  roomLoc?: string;
   // Add userDisplay/roomDisplay objects if you prefer that structure later
}