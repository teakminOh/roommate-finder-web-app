import type { Timestamp, FieldValue } from 'firebase/firestore';

// Base interface for common fields in match documents stored in Firestore
// Corresponds to BaseMatch in functions/src/interfaces.ts
export interface MatchBaseData {
    matchUpdatedAt: Timestamp | FieldValue; // When the match was last calculated
    score: number;                          // The compatibility score
    distance: number | null | undefined;    // Calculated distance (or null/undefined)
}

// Interface for user-user match documents stored in Firestore
// Corresponds to UserUserMatch in functions/src/interfaces.ts
export interface MatchUserUserData extends MatchBaseData {
  type: "user-user";
  uids: [string, string]; // Sorted IDs of the two matched users
  // Optional display data stored by function (if you kept it)
  user1Loc?: string;
  user2Loc?: string;
}

// Interface for user-room match documents stored in Firestore
// Corresponds to UserRoomMatch in functions/src/interfaces.ts
export interface MatchUserRoomData extends MatchBaseData {
  type: "user-room";
  userId: string;       // ID of the user in the match
  roomId: string;       // ID of the room in the match
  // Optional display data stored by function (if you kept it)
  userLoc?: string;
  roomLoc?: string;
}

// Optional: A union type representing any possible raw match data from Firestore
export type RawMatchData = MatchUserUserData | MatchUserRoomData;

// --- Types for Processed/Combined Data (Used in matches.vue) ---

// Structure holding the profile needed by RoommateItem and the raw match data
export interface DisplayableUserMatch {
    profile: import('~/types/user').Roommate; // Import Roommate type
    matchData: MatchUserUserData;
    matchDocId: string; // The ID of the match document itself
}

// Structure holding the profile needed by RoomItem and the raw match data
export interface DisplayableRoomMatch {
    profile: import('~/types/room').Room; // Import Room type
    matchData: MatchUserRoomData;
    matchDocId: string; // The ID of the match document itself
}