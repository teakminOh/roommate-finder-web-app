// src/index.ts
import * as functions from "firebase-functions/v1"; // Use v1 API
import * as admin from "firebase-admin";
// Remove geolib import if not used directly here anymore
// import * as geolib from "geolib";

// Import Interfaces
import {
    UserProfile,
    RoomProfile,
    UserUserMatch,
    UserRoomMatch
} from "./interfaces";

// Import Scoring Logic
import {
    calculateUserUserScore,
    calculateUserRoomScore,
    MATCH_SCORE_THRESHOLD // Import the threshold
} from "./scoring";

admin.initializeApp();
const db = admin.firestore();

// --- Configuration ---
const FUNCTION_REGION = "europe-west1";
const FUNCTION_MEMORY = "512MB"; // Might need more memory for scoring logic
const FUNCTION_TIMEOUT = 120; // Might need more time
const USERS_COLLECTION = "users";
const ROOMS_COLLECTION = "rooms";
const MATCHES_COLLECTION = "matches";

// --- Helper: Generic Match Deletion ---
/** Adds deletion operations for matches involving docId to batch. */
async function addMatchDeletionsToBatch(
    docType: "user" | "room",
    docId: string,
    batch: admin.firestore.WriteBatch
): Promise<number> {
    // ... (Function remains the same as before) ...
     functions.logger.info(`Queueing match deletions involving ${docType}: ${docId}`);
    let deleteCount = 0;
    const queries: admin.firestore.Query[] = [];

    if (docType === "user") {
        queries.push(db.collection(MATCHES_COLLECTION).where("type", "==", "user-room").where("userId", "==", docId));
        queries.push(db.collection(MATCHES_COLLECTION).where("type", "==", "user-user").where("uids", "array-contains", docId));
    } else {
        queries.push(db.collection(MATCHES_COLLECTION).where("type", "==", "user-room").where("roomId", "==", docId));
    }

    for (const query of queries) {
        const snapshot = await query.get();
        snapshot.forEach((doc) => {
            batch.delete(doc.ref);
            deleteCount++;
        });
    }
    functions.logger.info(` -> Added ${deleteCount} match deletions to batch.`);
    return deleteCount;
}


// --- Generic Handler Logic (Multi-Criteria Scoring) ---
/** Core logic executed by triggers, performs scoring. */
async function handleDocumentWriteWithScoring(
    change: functions.Change<functions.firestore.DocumentSnapshot>,
    context: functions.EventContext,
    primaryType: "user" | "room"
): Promise<void> {
    const primaryId = context.params.userId || context.params.roomId;
    const primaryDataAfter = change.after.data();
    // Ensure interfaces include ALL needed fields from Firestore
    const primaryProfile = change.after.exists && primaryDataAfter ?
        { ...primaryDataAfter, id: primaryId } as (UserProfile | RoomProfile) :
        null;

    const batch = db.batch();
    let opsCount = 0;

    // --- Handle Deletion or Incomplete Profile ---
    if (!primaryProfile || !primaryProfile.completedProfile) {
        functions.logger.info(`${primaryType} ${primaryId} deleted/incomplete. Deleting matches.`);
        try {
            opsCount = await addMatchDeletionsToBatch(primaryType, primaryId, batch);
            if (opsCount > 0) await batch.commit();
            functions.logger.info(`Processed ${opsCount} deletions for ${primaryType} ${primaryId}.`);
        } catch (error: unknown) {
            functions.logger.error(`Error deleting matches for ${primaryType} ${primaryId}:`, error);
        }
        return;
    }

    // --- Check for Coordinates (If still a hard requirement for location scoring) ---
    if (!primaryProfile.coordinates) {
         functions.logger.warn(`Skipping matching for ${primaryType} ${primaryId}: Missing 'coordinates'.`);
         // If location match is required, delete existing matches?
         // opsCount = await addMatchDeletionsToBatch(primaryType, primaryId, batch);
         // if (opsCount > 0) await batch.commit();
         return;
    }

    functions.logger.info(`Scoring matches triggered for ${primaryType}: ${primaryId}`);

    try {
        const collectionsToCompare: { type: "user" | "room", name: string }[] = [
            { type: "user", name: USERS_COLLECTION },
            { type: "room", name: ROOMS_COLLECTION },
        ];

        for (const secondary of collectionsToCompare) {
            if (primaryType === "room" && secondary.type === "room") continue;

            functions.logger.info(`Comparing ${primaryType} ${primaryId} with ${secondary.name}...`);

            // Query potential matches - Filter only by completion & coordinates for now
            // More complex pre-filtering could be added but increases complexity
            const query: admin.firestore.Query = db.collection(secondary.name)
                .where("completedProfile", "==", true)
                .where("coordinates", "!=", null); // Keep for location scoring


            const secondarySnapshot = await query.get();
            functions.logger.info(` -> Found ${secondarySnapshot.size} potential ${secondary.type}(s) for scoring.`);

            secondarySnapshot.forEach((doc) => {
                const secondaryId = doc.id;

                // Skip self-comparison
                if (primaryType === secondary.type && primaryId === secondaryId) {
                    return;
                }

                const secondaryProfile = { ...doc.data(), id: secondaryId } as (UserProfile | RoomProfile);

                // Ensure secondary has coordinates if needed for scoring
                 if (!secondaryProfile.coordinates) {
                      functions.logger.debug(` ---> Skipping ${secondary.type} ${secondaryId} - Missing Coordinates.`);
                      return;
                 }

                functions.logger.info(` ---> Scoring pair: ${primaryId} / ${secondaryId}`);

                let matchId: string = "";
                let matchRef: admin.firestore.DocumentReference | null = null;
                let scoreResult: { score: number, distance: number | null } | null = null;

                // Calculate Score
                if (primaryType === "user" && secondary.type === "user") {
                    scoreResult = calculateUserUserScore(primaryProfile as UserProfile, secondaryProfile as UserProfile);
                    const sortedIds = [primaryId, secondaryId].sort();
                    matchId = `user_${sortedIds.join("_")}`;
                    matchRef = db.collection(MATCHES_COLLECTION).doc(matchId);
                } else if (primaryType === "user" && secondary.type === "room") {
                    scoreResult = calculateUserRoomScore(primaryProfile as UserProfile, secondaryProfile as RoomProfile);
                    matchId = `room_${primaryId}_${secondaryId}`;
                    matchRef = db.collection(MATCHES_COLLECTION).doc(matchId);
                } else if (primaryType === "room" && secondary.type === "user") {
                     scoreResult = calculateUserRoomScore(secondaryProfile as UserProfile, primaryProfile as RoomProfile); // User profile first
                    matchId = `room_${secondaryId}_${primaryId}`; // User ID first
                    matchRef = db.collection(MATCHES_COLLECTION).doc(matchId);
                }

                functions.logger.info(` ---> Score Result for ${primaryId}/${secondaryId}: ${scoreResult?.score ?? 'N/A'} (Threshold: ${MATCH_SCORE_THRESHOLD})`);

                // Add set or delete operation to batch based on score
                if (matchRef) {
                    if (scoreResult !== null && scoreResult.score >= MATCH_SCORE_THRESHOLD) {
                        // Create match data object
                        let matchData: UserUserMatch | UserRoomMatch;
                        if(primaryType === "user" && secondary.type === "user") {
                             const sortedIds = [primaryId, secondaryId].sort();
                             matchData = {
                                type: "user-user", uids: [sortedIds[0], sortedIds[1]],
                                user1Loc: sortedIds[0] === primaryId ? primaryProfile.location : secondaryProfile.location,
                                user2Loc: sortedIds[1] === primaryId ? primaryProfile.location : secondaryProfile.location,
                                score: scoreResult.score,
                                distance: scoreResult.distance,
                                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                             };
                        } else { // User-Room or Room-User
                             const userProf = (primaryType === "user" ? primaryProfile : secondaryProfile) as UserProfile;
                             const roomProf = (primaryType === "room" ? primaryProfile : secondaryProfile) as RoomProfile;
                             matchData = {
                                type: "user-room",
                                userId: userProf.id,
                                roomId: roomProf.id,
                                userLoc: userProf.location,
                                roomLoc: roomProf.location,
                                score: scoreResult.score,
                                distance: scoreResult.distance,
                                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                             };
                        }
                        functions.logger.info(` -> Match found (Score >= Threshold): ${matchRef.path}, Score: ${scoreResult.score}, Dist: ${scoreResult.distance}m`);
                        batch.set(matchRef, matchData, { merge: true });
                        opsCount++;

                    } else { // Score is null (hard fail) or below threshold
                        functions.logger.debug(` -> Score below threshold or hard fail. Deleting match if exists: ${matchRef.path}`);
                        batch.delete(matchRef);
                        opsCount++;
                    }
                } else {
                     functions.logger.warn(` ---> !!! matchRef was not set for pair ${primaryId}/${secondaryId} (Logic Error?)`);
                 }
            }); // End secondarySnapshot.forEach
        } // End for loop

        // Commit batch if needed
        if (opsCount > 0) {
            await batch.commit();
            functions.logger.info(`Committed ${opsCount} match operations for ${primaryType} ${primaryId}.`);
        } else {
            functions.logger.info(`No matching operations for ${primaryType} ${primaryId}.`);
        }
    } catch (error: unknown) {
        functions.logger.error(`Error during scoring for ${primaryType} ${primaryId}:`, error);
    }
}

// --- Exported Trigger Functions ---

export const matchOnUserWriteScored = functions // Renamed
    .region(FUNCTION_REGION)
    .runWith({ memory: FUNCTION_MEMORY, timeoutSeconds: FUNCTION_TIMEOUT })
    .firestore.document(`${USERS_COLLECTION}/{userId}`)
    .onWrite((change, context) => handleDocumentWriteWithScoring(change, context, "user"));

export const matchOnRoomWriteScored = functions // Renamed
    .region(FUNCTION_REGION)
    .runWith({ memory: FUNCTION_MEMORY, timeoutSeconds: FUNCTION_TIMEOUT })
    .firestore.document(`${ROOMS_COLLECTION}/{roomId}`)
    .onWrite((change, context) => handleDocumentWriteWithScoring(change, context, "room"));