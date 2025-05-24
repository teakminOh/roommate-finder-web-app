// src/scoring.ts
import * as functions from "firebase-functions/v1"; 
import * as geolib from "geolib";
import { UserProfile, RoomProfile } from "./interfaces"; // Import interfaces
import * as admin from "firebase-admin"; // Import admin for GeoPoint type

// --- Configuration ---
export const MATCH_SCORE_THRESHOLD = 50; // Minimum score to be considered a match (Adjust!)
const MATCH_RADIUS_METERS = 10000; // Max distance for location match (Adjust!)

// --- Scoring Weights (ADJUST THESE BASED ON IMPORTANCE!) ---
const SCORE_WEIGHTS = {
    // Hard Filters (Implicitly highest weight - fail if not met)
    LOCATION_RADIUS: 30,
    BUDGET_ROOM_AFFORDABLE: 25, // User budget >= room budget

    // User-User Specific
    BUDGET_USER_SIMILARITY: 15, // How close user budgets are
    AGE_MUTUAL_PREFERENCE: 10,
    STUDENT_USER_MATCH: 20, // 0-4 scale (0 = mismatch, 4 = exact match)
    // GENDER_MUTUAL_PREFERENCE: 10,
    LIFESTYLE_SIMILARITY: 15, // Aggregate score for habits
    PETS_USER_COMPATIBILITY: 5, // Simple check for now
    SMOKING_USER_COMPATIBILITY: 5,
    DAY_PREFERENCE_SIMILARITY: 10,

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
// src/scoring.ts

/**
 * Calculates distance between two GeoPoints.
 * Returns null if either point is missing or calculation fails.
 * @param {admin.firestore.GeoPoint | undefined} geoPoint1 - First GeoPoint.
 * @param {admin.firestore.GeoPoint | undefined} geoPoint2 - Second GeoPoint.
 * @returns {number | null} The distance in meters, or null.
 */
function getDistanceBetweenPoints( // Renamed
    geoPoint1: admin.firestore.GeoPoint | undefined,
    geoPoint2: admin.firestore.GeoPoint | undefined,
): number | null {
    if (!geoPoint1 || !geoPoint2) {
        return null;
    }
    try {
        const distance = geolib.getDistance(
            { latitude: geoPoint1.latitude, longitude: geoPoint1.longitude },
            { latitude: geoPoint2.latitude, longitude: geoPoint2.longitude }
        );
        return Math.round(distance); // Return the calculated distance
    } catch (e: unknown) {
        console.error("Error calculating distance in helper:", e);
        return null; // Error during calculation
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
/**
 * Checks if userB's gender matches userA's preference.
 * Handles specific Slovak terms and 'Nezáleží'.
 * @param {string | undefined} userBGender - The gender of the person being evaluated.
 * @param {string | undefined} userAPreference - The preference of the person evaluating.
 * @returns {boolean} True if compatible or no preference stated/invalid pref.
 */
function checkGenderMatch(userBGender?: string, userAPreference?: string): boolean {
    if (!userAPreference || !userBGender) return true; // Assume compatible if data missing

    const lowerPref = userAPreference.toLowerCase().trim();
    const lowerUserB = userBGender.toLowerCase().trim();

    if (lowerPref === 'nezáleží' || lowerPref === 'any') return true; // Prefers anyone

    // Check specific matches
    if ((lowerPref === 'žena' || lowerPref === 'female') && lowerUserB === 'female') return true;
    if ((lowerPref === 'muž' || lowerPref === 'male') && lowerUserB === 'male') return true;

    // Add rules for other genders if needed

    return false; // Explicit mismatch if preference is specific and doesn't match
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

/**
 * Calculates a student compatibility score based on status, school, faculty, program.
 * Returns a score from 0 (mismatch status) to 4 (exact program match).
 * @param {UserProfile} userA - First user profile.
 * @param {UserProfile} userB - Second user profile.
 * @returns {number} A score indicating student compatibility level (0-4).
 */
function calculateStudentMatchLevel(userA: UserProfile, userB: UserProfile): number {
    let level = 0;
    const studentA = userA.student ?? false; // Default to non-student if undefined
    const studentB = userB.student ?? false;

    // Level 1: Matching Status (Both students or both non-students)
    if (studentA === studentB) {
        level = 1;

        // Check further details only if BOTH are students
        if (studentA === true) { // implies studentB is also true here
            const schoolA = userA.selectedSchool?.trim().toLowerCase();
            const schoolB = userB.selectedSchool?.trim().toLowerCase();

            // Level 2: Same School
            if (schoolA && schoolB && schoolA === schoolB && schoolA !== "") {
                level = 2;

                const facultyA = userA.selectedFaculty?.trim().toLowerCase();
                const facultyB = userB.selectedFaculty?.trim().toLowerCase();

                // Level 3: Same Faculty (requires same school)
                if (facultyA && facultyB && facultyA === facultyB && facultyA !== "") {
                    level = 3;

                    const programA = userA.studyProgram?.trim().toLowerCase();
                    const programB = userB.studyProgram?.trim().toLowerCase();

                    // Level 4: Same Program (requires same faculty)
                    if (programA && programB && programA === programB && programA !== "") {
                        level = 4;
                    }
                }
            }
        }
    }
    // If student status mismatched initially, level remains 0

    return level;
}

// --- Main Scoring Functions ---

// src/scoring.ts

export function calculateUserUserScore(userA: UserProfile, userB: UserProfile): { score: number, distance: number | null } | null {

    // --- Hard Filters ---

    
    const distance = getDistanceBetweenPoints(userA.coordinates, userB.coordinates); // Use new helper

    if (distance === null || distance > MATCH_RADIUS_METERS) { // Hard fail if no coords or outside radius
        return null;
    }

    // Calculate scaled location score (closer = better)
    // Example scaling: Linear decrease from max score at 0m to 0 score at MATCH_RADIUS_METERS
    // Formula: weight * (1 - (distance / radius))
    // Clamp between 0 and full weight just in case distance is slightly negative/large due to rounding/edge cases
    const locationScoreRatio = Math.max(0, 1 - (distance / MATCH_RADIUS_METERS));
    const locationScore = locationScoreRatio * SCORE_WEIGHTS.LOCATION_RADIUS;



    // *** NEW: Gender Hard Fail ***
    const prefA = userA.preferredGender?.toLowerCase().trim();
    const prefB = userB.preferredGender?.toLowerCase().trim();
    const genderA = userA.gender?.toLowerCase().trim();
    const genderB = userB.gender?.toLowerCase().trim();

    // Fail if A wants specific gender and B doesn't match
    if ((prefA === 'žena') && genderB !== 'žena') {
         return null;
    }
    if ((prefA === 'muž') && genderB !== 'muž') {
         return null;
    }
    // Fail if B wants specific gender and A doesn't match
    if ((prefB === 'žena') && genderA !== 'žena') {
         return null;
    }
    if ((prefB === 'muž') && genderA !== 'muž') {
         return null;
    }
    // Note: This covers Woman seeking Woman (if A wants F, B must be F)
    // and Man seeking Man (if A wants M, B must be M).
    // It allows Woman seeking Man, Man seeking Woman, and Any seeking Any/Specific.

    // --- Calculate Weighted Score ---
    let score = 0;
    const MAX_STUDENT_LEVEL = 4;
    score += locationScore;

    // Location Score
    score += SCORE_WEIGHTS.LOCATION_RADIUS;

    // Budget Score
    const budgetA = userA.budget ?? 0;
    const budgetB = userB.budget ?? 0;
    if (budgetA > 0 && budgetB > 0) {
        // ... (budget variance logic adding to score) ...
         const diff = Math.abs(budgetA - budgetB);
         const avg = (budgetA + budgetB) / 2;
         const variance = diff / avg;
         if (variance < 0.10) score += SCORE_WEIGHTS.BUDGET_USER_SIMILARITY;
         else if (variance < 0.25) score += SCORE_WEIGHTS.BUDGET_USER_SIMILARITY * 0.7;
         else if (variance < 0.40) score += SCORE_WEIGHTS.BUDGET_USER_SIMILARITY * 0.4;
         else if (variance < 0.60) score += SCORE_WEIGHTS.BUDGET_USER_SIMILARITY * 0.1;
    }

    // Age Score
    const ageAOkWithB = isAgeInRange(userB.age, userA.preferredAgeRange);
    const ageBOkWithA = isAgeInRange(userA.age, userB.preferredAgeRange);
    if (ageAOkWithB && ageBOkWithA) score += SCORE_WEIGHTS.AGE_MUTUAL_PREFERENCE;
    else if (ageAOkWithB || ageBOkWithA) score += SCORE_WEIGHTS.AGE_MUTUAL_PREFERENCE * 0.5;

    // Gender Score (Optional - only if preferences are "Nezáleží")
    // Since specific preferences are hard fails, we only might score if one/both don't care
    // const genderAOkWithB = checkGenderMatch(userB.gender, userA.preferredGender);
    // const genderBOkWithA = checkGenderMatch(userA.gender, userB.preferredGender);
    // if (genderAOkWithB && genderBOkWithA) score += SCORE_WEIGHTS.GENDER_MUTUAL_PREFERENCE; // Or maybe remove points entirely?

     // Smoking Score
     const smokerA = userA.isSmoker ?? false;
     const smokerB = userB.isSmoker ?? false;
     if (smokerA === smokerB) score += SCORE_WEIGHTS.SMOKING_USER_COMPATIBILITY;

     // Pet Score
     const petsA = userA.hasPets || userA.hasDog || userA.hasCat || userA.hasOtherPets;
     const petsB = userB.hasPets || userB.hasDog || userB.hasCat || userB.hasOtherPets;
     if (petsA === petsB) score += SCORE_WEIGHTS.PETS_USER_COMPATIBILITY;

     // Lifestyle Score
     const lifestyleScore = calculateLifestyleSimilarityScore(userA, userB);
     score += lifestyleScore * SCORE_WEIGHTS.LIFESTYLE_SIMILARITY;

     // Student Match Score
     const studentMatchLevel = calculateStudentMatchLevel(userA, userB);
     score += (studentMatchLevel / MAX_STUDENT_LEVEL) * SCORE_WEIGHTS.STUDENT_USER_MATCH;

     // *** NEW: Day Preference Score ***
     const dayPrefA = userA.dayPreference;
     const dayPrefB = userB.dayPreference;
     if (dayPrefA && dayPrefB && dayPrefA === dayPrefB) {
         // Full points if preferences match exactly
         score += SCORE_WEIGHTS.DAY_PREFERENCE_SIMILARITY;
     } else if (dayPrefA && dayPrefB && dayPrefA !== dayPrefB) {
         // Partial points if both have preferences but they differ? Or zero?
         // Example: Check if one is "Niečo medzi" and the other isn't (some compatibility?)
         const middle = "Niečo medzi"; // Assuming this is the exact string
         if (dayPrefA === middle || dayPrefB === middle) {
             score += SCORE_WEIGHTS.DAY_PREFERENCE_SIMILARITY * 0.4; // e.g., 40% points
         }
         // Otherwise (e.g., Ranné vtáča vs Nočná sova) -> 0 points added
     } else if (dayPrefA || dayPrefB) {
         // One specified, one didn't - maybe slight points? Or zero?
         // score += SCORE_WEIGHTS.DAY_PREFERENCE_SIMILARITY * 0.1;
     }
     // If neither specified, 0 points added.


    // --- Determine Max Possible Score (for Normalization) ---
    // Sum ALL weights used in the scoring above
    const maxScorePossible =
        SCORE_WEIGHTS.LOCATION_RADIUS +
        SCORE_WEIGHTS.BUDGET_USER_SIMILARITY +
        SCORE_WEIGHTS.AGE_MUTUAL_PREFERENCE +
        // SCORE_WEIGHTS.GENDER_MUTUAL_PREFERENCE + // Removed if using hard fail mostly
        SCORE_WEIGHTS.LIFESTYLE_SIMILARITY +
        SCORE_WEIGHTS.PETS_USER_COMPATIBILITY +
        SCORE_WEIGHTS.SMOKING_USER_COMPATIBILITY +
        SCORE_WEIGHTS.STUDENT_USER_MATCH +
        SCORE_WEIGHTS.DAY_PREFERENCE_SIMILARITY; // Add the new weight


    // --- Final Score ---
    const normalizedScore = maxScorePossible > 0
        ? Math.round((score / maxScorePossible) * 100)
        : 0;
    const finalScore = Math.max(0, Math.min(normalizedScore, 100));

    return { score: finalScore, distance: distance };
}

// --- Remember to Update calculateUserRoomScore as well ---
// The GENDER hard fail logic might differ slightly for User-Room
// e.g., only check room.preferredGender against user.gender

/**
 * Calculates compatibility score between a user and a room.
 * Returns null if core requirements (location, budget) aren't met.
 * Otherwise returns score (potentially 0-100 after normalization).
 */
// src/scoring.ts

export function calculateUserRoomScore(user: UserProfile, room: RoomProfile): { score: number, distance: number | null } | null {

    // --- Hard Filters ---

    // Location
    const distance = getDistanceBetweenPoints(user.coordinates, room.coordinates);
    if (distance === null || distance > MATCH_RADIUS_METERS) {
        functions.logger.debug(`!!! USER-ROOM HARD FAIL: ${user.id}/${room.id} - Distance null or > radius (${distance}m)`);
        return null;
    }
    // Calculate location score contribution (closer = better)
    const locationScoreRatio = Math.max(0, 1 - (distance / MATCH_RADIUS_METERS));
    const locationScoreContribution = locationScoreRatio * SCORE_WEIGHTS.LOCATION_RADIUS;

    // Budget
    // *** Log values BEFORE check ***
    functions.logger.debug(`--- Budget Check: User ${user.id} (${typeof user.budget} ${user.budget}) vs Room ${room.id} (${typeof room.budget} ${room.budget})`);
    if (typeof user.budget !== 'number' || typeof room.budget !== 'number' || user.budget < room.budget) {
        functions.logger.debug(`!!! USER-ROOM HARD FAIL: Budget Check Failed`);
        return null; // Cannot afford = NO MATCH
    }
    // *** No points added just for passing budget hard fail ***

    // Gender Preference Hard Fail
    const roomPref = room.preferredGender?.toLowerCase().trim();
    const userGender = user.gender?.toLowerCase().trim();
    // Use || to check Slovak and English terms
    if ((roomPref === 'žena' || roomPref === 'female') && userGender !== 'female') {
         functions.logger.debug(`!!! USER-ROOM HARD FAIL: Strict Gender Pref 'female' mismatch`);
        return null;
    }
    // *** Corrected check for male ***
    if ((roomPref === 'muž' || roomPref === 'male') && userGender !== 'male') {
         functions.logger.debug(`!!! USER-ROOM HARD FAIL: Strict Gender Pref 'male' mismatch`);
        return null;
    }

    // Pet Compatibility Hard Fail
    const userHasPets = user.hasPets || user.hasDog || user.hasCat || user.hasOtherPets;
    if (userHasPets && room.petsAllowed === false) {
        functions.logger.debug(`!!! USER-ROOM HARD FAIL: Pets not allowed`);
        return null;
    }

    // Student Policy Hard Fail
    if (user.student && room.studentsWelcome === false) {
        functions.logger.debug(`!!! USER-ROOM HARD FAIL: Students not welcome`);
        return null;
    }

    // Move Date Compatibility Hard Fail (Optional but recommended)
     if (!checkMoveDate(user.preferredMoveDate, room.availableFrom)) {
          functions.logger.debug(`!!! USER-ROOM HARD FAIL: Move Date Incompatible`);
          return null;
     }


    // --- Calculate Weighted Score (If all hard fails passed) ---
    let score = 0;
    // *** Define Max Score based ONLY on weights added below ***
    const maxScorePossible =
        SCORE_WEIGHTS.LOCATION_RADIUS +       // Max potential from location
        SCORE_WEIGHTS.GENDER_ROOM_PREFERENCE +
        SCORE_WEIGHTS.PETS_ROOM_POLICY +
        SCORE_WEIGHTS.STUDENT_POLICY +
        SCORE_WEIGHTS.MOVE_DATE;
        // Add other weights only if they are added to 'score' below

    // Add Location Score (calculated earlier)
    score += locationScoreContribution;

    // Add Gender Score (only if compatible or room doesn't care)
    if (checkGenderMatch(user.gender, room.preferredGender)) {
         score += SCORE_WEIGHTS.GENDER_ROOM_PREFERENCE;
    }

    // Add Pet Score
    if (userHasPets && room.petsAllowed === true) {
        let specificPetMatch = true;
        if (user.hasDog && room.dogFriendly === false) specificPetMatch = false;
        if (user.hasCat && room.catFriendly === false) specificPetMatch = false;
        if (specificPetMatch) score += SCORE_WEIGHTS.PETS_ROOM_POLICY;
    } else if (!userHasPets) {
        score += SCORE_WEIGHTS.PETS_ROOM_POLICY;
    }

    // Add Student Score
    if (user.student && room.studentsWelcome === true) score += SCORE_WEIGHTS.STUDENT_POLICY;
    else if (user.student === false) score += SCORE_WEIGHTS.STUDENT_POLICY;

    // Add Move Date Score (already passed hard fail if implemented)
    // Note: checkMoveDate already called for hard fail, no need to call again
    // If we passed the hard fail, we assume compatibility here
    score += SCORE_WEIGHTS.MOVE_DATE;


    // --- Final Score ---
    const normalizedScore = maxScorePossible > 0
        ? Math.round((score / maxScorePossible) * 100)
        : 0;
    const finalScore = Math.max(0, Math.min(normalizedScore, 100));

    return { score: finalScore, distance: distance };
}