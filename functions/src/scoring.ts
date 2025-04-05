// src/scoring.ts
import * as geolib from "geolib";
import { UserProfile, RoomProfile } from "./interfaces"; // Import interfaces
import * as admin from "firebase-admin"; // Import admin for GeoPoint type

// --- Configuration ---
export const MATCH_SCORE_THRESHOLD = 50; // Minimum score to be considered a match (Adjust!)
const MATCH_RADIUS_METERS = 5000; // Max distance for location match (Adjust!)

// --- Scoring Weights (ADJUST THESE BASED ON IMPORTANCE!) ---
const SCORE_WEIGHTS = {
    // Hard Filters (Implicitly highest weight - fail if not met)
    LOCATION_RADIUS: 30,
    BUDGET_ROOM_AFFORDABLE: 25, // User budget >= room budget

    // User-User Specific
    BUDGET_USER_SIMILARITY: 15, // How close user budgets are
    AGE_MUTUAL_PREFERENCE: 10,
    GENDER_MUTUAL_PREFERENCE: 10,
    LIFESTYLE_SIMILARITY: 15, // Aggregate score for habits
    PETS_USER_COMPATIBILITY: 5, // Simple check for now
    SMOKING_USER_COMPATIBILITY: 5,

    // User-Room Specific
    GENDER_ROOM_PREFERENCE: 10, // Room's preference met by user
    PETS_ROOM_POLICY: 15, // User pets vs room policy
    STUDENT_POLICY: 5,
    MOVE_DATE: 10,

    // Shared? (Could apply to both contexts if needed)
    // e.g., STUDENT_MATCH: 5, // If both are students/non-students
};

// --- Helper Functions for Scoring ---

/** Calculates distance if within radius. Returns distance or null. */
function getDistanceIfWithinRadius(
    geoPoint1: admin.firestore.GeoPoint | undefined,
    geoPoint2: admin.firestore.GeoPoint | undefined,
    radiusInMeters: number
): number | null {
    if (!geoPoint1 || !geoPoint2) return null;
    try {
        const distance = geolib.getDistance(
            { latitude: geoPoint1.latitude, longitude: geoPoint1.longitude },
            { latitude: geoPoint2.latitude, longitude: geoPoint2.longitude }
        );
        return distance <= radiusInMeters ? Math.round(distance) : null;
    } catch (e: unknown) {
        console.error("Error calculating distance in helper:", e); // Log error
        return null;
    }
}

/** Parses age range string "min-max". */
function parseAgeRange(rangeString?: string): { min: number; max: number } | null {
    if (!rangeString || typeof rangeString !== 'string') return null;
    const parts = rangeString.split('-');
    if (parts.length !== 2) return null;
    const min = parseInt(parts[0], 10);
    const max = parseInt(parts[1], 10);
    if (isNaN(min) || isNaN(max) || min > max) return null;
    return { min, max };
}

/** Checks if an age falls within a range string. */
function isAgeInRange(age?: number, preferredRangeString?: string): boolean {
    if (age === undefined || age === null) return false;
    const range = parseAgeRange(preferredRangeString);
    if (!range) return true; // No preference set = compatible
    return age >= range.min && age <= range.max;
}

/** Checks if user gender matches a preference ('Muž', 'Žena', 'Nezáleží'). */
function checkGenderMatch(userGender?: string, preferredGender?: string): boolean {
    if (!preferredGender || !userGender) return true; // Assume compatible if data missing
    const lowerPref = preferredGender.toLowerCase();
    const lowerUser = userGender.toLowerCase();

    if (lowerPref === 'nezáleží' || lowerPref === 'any') return true;
    if ((lowerPref === 'žena' || lowerPref === 'female') && lowerUser === 'female') return true;
    if ((lowerPref === 'muž' || lowerPref === 'male') && lowerUser === 'male') return true;
    return false; // Mismatch
}

/** Compares move date (user wants) vs available date (room is). True if user>=room */
function checkMoveDate(userPrefDateStr?: string, roomAvailDateStr?: string): boolean {
    if (!userPrefDateStr || !roomAvailDateStr) return true; // Compatible if unspecified
    try {
        const userDate = new Date(userPrefDateStr + 'T00:00:00Z');
        const roomDate = new Date(roomAvailDateStr + 'T00:00:00Z');
        if (isNaN(userDate.getTime()) || isNaN(roomDate.getTime())) return true; // Invalid date = compatible?
        return userDate >= roomDate;
    } catch (e) {
        console.error("Error comparing move dates:", e);
        return true; // Error = compatible?
    }
}

/** Scores lifestyle similarity (0-1). Simple exact match for now. */
function calculateLifestyleSimilarityScore(userA: UserProfile, userB: UserProfile): number {
    let score = 0;
    let comparisons = 0;
    const fields: (keyof UserProfile)[] = [
        "cleanlinessLevel", "cleaningFrequency", "cookingFrequency",
        "guestFrequency", "noiseTolerance", "workHome", "dayPreference",
        "alcoholUse" // Add more as needed
    ];

    for (const field of fields) {
        if (userA[field] !== undefined && userB[field] !== undefined) {
            comparisons++;
            if (userA[field] === userB[field]) {
                score++;
            }
        }
    }
    return comparisons > 0 ? score / comparisons : 0.5; // Return 0.5 if no comparable fields?
}


// --- Main Scoring Functions ---

/**
 * Calculates compatibility score between two users.
 * Returns null if core requirements (like location) aren't met.
 * Otherwise returns score (potentially 0-100 after normalization).
 */
export function calculateUserUserScore(userA: UserProfile, userB: UserProfile): { score: number, distance: number | null } | null {
    let score = 0;
    const maxScorePossible =
        SCORE_WEIGHTS.LOCATION_RADIUS +
        SCORE_WEIGHTS.BUDGET_USER_SIMILARITY +
        SCORE_WEIGHTS.AGE_MUTUAL_PREFERENCE +
        SCORE_WEIGHTS.GENDER_MUTUAL_PREFERENCE +
        SCORE_WEIGHTS.LIFESTYLE_SIMILARITY +
        SCORE_WEIGHTS.PETS_USER_COMPATIBILITY +
        SCORE_WEIGHTS.SMOKING_USER_COMPATIBILITY;


    // --- Location (Hard Filter / High Weight) ---
    const distance = getDistanceIfWithinRadius(userA.coordinates, userB.coordinates, MATCH_RADIUS_METERS);
    if (distance === null) {
        return null; // Outside radius = NO MATCH
    }
    score += SCORE_WEIGHTS.LOCATION_RADIUS;

    // --- Budget Similarity ---
    const budgetA = userA.budget ?? 0;
    const budgetB = userB.budget ?? 0;
    if (budgetA > 0 && budgetB > 0) {
         const diff = Math.abs(budgetA - budgetB);
         const avg = (budgetA + budgetB) / 2;
         const variance = diff / avg;
         // Award points based on closeness (example scaling)
         if (variance < 0.10) score += SCORE_WEIGHTS.BUDGET_USER_SIMILARITY; // Very close
         else if (variance < 0.25) score += SCORE_WEIGHTS.BUDGET_USER_SIMILARITY * 0.7;
         else if (variance < 0.40) score += SCORE_WEIGHTS.BUDGET_USER_SIMILARITY * 0.4;
         else if (variance < 0.60) score += SCORE_WEIGHTS.BUDGET_USER_SIMILARITY * 0.1;
    }

    // --- Age Compatibility ---
    const ageAOkWithB = isAgeInRange(userB.age, userA.preferredAgeRange);
    const ageBOkWithA = isAgeInRange(userA.age, userB.preferredAgeRange);
    if (ageAOkWithB && ageBOkWithA) score += SCORE_WEIGHTS.AGE_MUTUAL_PREFERENCE;
    else if (ageAOkWithB || ageBOkWithA) score += SCORE_WEIGHTS.AGE_MUTUAL_PREFERENCE * 0.5; // Partial

    // --- Gender Compatibility ---
    const genderAOkWithB = checkGenderMatch(userB.gender, userA.preferredGender);
    const genderBOkWithA = checkGenderMatch(userA.gender, userB.preferredGender);
     if (genderAOkWithB && genderBOkWithA) score += SCORE_WEIGHTS.GENDER_MUTUAL_PREFERENCE;
     else if (genderAOkWithB || genderBOkWithA) score += SCORE_WEIGHTS.GENDER_MUTUAL_PREFERENCE * 0.5; // Partial if one ok

     // --- Smoking ---
     if (userA.isSmoker === userB.isSmoker) score += SCORE_WEIGHTS.SMOKING_USER_COMPATIBILITY;
     // TODO: Add preference logic (e.g., non-smoker explicitly dislikes smokers = penalty?)

     // --- Pets ---
     const petsA = userA.hasPets || userA.hasDog || userA.hasCat || userA.hasOtherPets;
     const petsB = userB.hasPets || userB.hasDog || userB.hasCat || userB.hasOtherPets;
     if (petsA === petsB) score += SCORE_WEIGHTS.PETS_USER_COMPATIBILITY;
     // TODO: Add tolerance (user ok with pets even if they don't have one?)

     // --- Lifestyle ---
     const lifestyleScore = calculateLifestyleSimilarityScore(userA, userB);
     score += lifestyleScore * SCORE_WEIGHTS.LIFESTYLE_SIMILARITY;

    // --- Final Score ---
    // Normalize to 0-100 (optional, but good practice)
    const normalizedScore = Math.round((score / maxScorePossible) * 100);
    const finalScore = Math.max(0, Math.min(normalizedScore, 100)); // Clamp

    return { score: finalScore, distance: distance };
}


/**
 * Calculates compatibility score between a user and a room.
 * Returns null if core requirements (location, budget) aren't met.
 * Otherwise returns score (potentially 0-100 after normalization).
 */
export function calculateUserRoomScore(user: UserProfile, room: RoomProfile): { score: number, distance: number | null } | null {
    let score = 0;
    const maxScorePossible =
        SCORE_WEIGHTS.LOCATION_RADIUS +
        SCORE_WEIGHTS.BUDGET_ROOM_AFFORDABLE +
        SCORE_WEIGHTS.GENDER_ROOM_PREFERENCE +
        SCORE_WEIGHTS.PETS_ROOM_POLICY +
        SCORE_WEIGHTS.STUDENT_POLICY +
        SCORE_WEIGHTS.MOVE_DATE;
        // Add max possible points for other criteria as you implement them

    // --- Location (Hard Filter) ---
    const distance = getDistanceIfWithinRadius(user.coordinates, room.coordinates, MATCH_RADIUS_METERS);
    if (distance === null) {
        return null; // Outside radius = NO MATCH
    }
    score += SCORE_WEIGHTS.LOCATION_RADIUS;

    // --- Budget (Hard Filter) ---
    if (typeof user.budget !== 'number' || typeof room.budget !== 'number' || user.budget < room.budget) {
        return null; // Cannot afford = NO MATCH
    }
    score += SCORE_WEIGHTS.BUDGET_ROOM_AFFORDABLE;

    // --- Gender Preference (Room's preference for User) ---
    if (checkGenderMatch(user.gender, room.preferredGender)) {
         score += SCORE_WEIGHTS.GENDER_ROOM_PREFERENCE;
    } else {
        // If room has a strict preference the user doesn't meet, fail?
        if (room.preferredGender && room.preferredGender.toLowerCase() !== 'nezáleží' && room.preferredGender.toLowerCase() !== 'any') {
             return null; // Hard fail if room preference is strict and doesn't match
        }
        // Otherwise, just no points added if preference exists but doesn't match loosely
    }

    // --- Pet Compatibility ---
    const userHasPets = user.hasPets || user.hasDog || user.hasCat || user.hasOtherPets;
    if (userHasPets && room.petsAllowed === false) return null; // Hard fail
    if (userHasPets && room.petsAllowed === true) {
        let specificPetMatch = true; // Check if specific NOs exist
        if (user.hasDog && room.dogFriendly === false) specificPetMatch = false;
        if (user.hasCat && room.catFriendly === false) specificPetMatch = false;
        if (specificPetMatch) score += SCORE_WEIGHTS.PETS_ROOM_POLICY; // Full points
        // else: Room generally allows, but not user's specific pet - maybe partial points?
        // score += SCORE_WEIGHTS.PETS_ROOM_POLICY * 0.2;
    } else if (!userHasPets) {
        score += SCORE_WEIGHTS.PETS_ROOM_POLICY; // User has no pets, always compatible
    }
    // Note: if room.petsAllowed is undefined, we don't add points if user has pets (uncertain match)

    // --- Student Policy ---
     if (user.student && room.studentsWelcome === false) return null; // Hard fail
     if (user.student && room.studentsWelcome === true) score += SCORE_WEIGHTS.STUDENT_POLICY;
     else if (user.student === false) score += SCORE_WEIGHTS.STUDENT_POLICY; // Non-students usually ok

     // --- Move Date Compatibility ---
     if (checkMoveDate(user.preferredMoveDate, room.availableFrom)) {
         score += SCORE_WEIGHTS.MOVE_DATE;
     }

    // --- Add Other Criteria ---
    // Example: Furnished Preference (Requires user.wantsFurnished field)
    // if (user.wantsFurnished === true && room.isFurnished === true) score += WEIGHT_FURNISHED;
    // else if (user.wantsFurnished === false && room.isFurnished === false) score += WEIGHT_FURNISHED;
    // else if (user.wantsFurnished === undefined) score += WEIGHT_FURNISHED * 0.5; // User doesn't care

    // Example: Parking Preference (Requires user.needsParking field)
    // if (user.needsParking === true && room.parkingAvailable === true) score += WEIGHT_PARKING;
    // else if (user.needsParking === false) score += WEIGHT_PARKING; // User doesn't need it

    // --- Final Score ---
    const normalizedScore = Math.round((score / maxScorePossible) * 100);
    const finalScore = Math.max(0, Math.min(normalizedScore, 100)); // Clamp

    return { score: finalScore, distance: distance };
}