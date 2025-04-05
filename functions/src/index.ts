import * as functions from "firebase-functions/v1"; // Use v1 API
import * as admin from "firebase-admin";
import * as geolib from "geolib"; // Import geolib

import {
    UserProfile,
    RoomProfile,
    UserUserMatch,
    UserRoomMatch
} from "./interfaces";

admin.initializeApp();
const db = admin.firestore();


// --- Configuration ---
const FUNCTION_REGION = "europe-west1";
const FUNCTION_MEMORY = "256MB";
const FUNCTION_TIMEOUT = 60;
const USERS_COLLECTION = "users";
const ROOMS_COLLECTION = "rooms";
const MATCHES_COLLECTION = "matches";
const MATCH_RADIUS_METERS = 50000; // Adjust as needed

// --- Helper: Calculate Distance if Within Radius ---
/**
 * Calculates distance if two Firestore GeoPoints are within a specified radius.
 * @param {admin.firestore.GeoPoint | undefined} geoPoint1 - First GeoPoint.
 * @param {admin.firestore.GeoPoint | undefined} geoPoint2 - Second GeoPoint.
 * @param {number} radiusInMeters - The maximum distance allowed.
 * @returns {number | null} The distance in meters if within radius, otherwise null.
 */
function getDistanceIfWithinRadius( // Renamed function
    geoPoint1: admin.firestore.GeoPoint | undefined,
    geoPoint2: admin.firestore.GeoPoint | undefined,
    radiusInMeters: number
): number | null { // Return type changed
    if (!geoPoint1 || !geoPoint2) {
        // functions.logger.debug("Cannot calculate distance: Missing GeoPoint data.");
        return null; // Cannot calculate distance without both points
    }
    try {
        const distance = geolib.getDistance(
            { latitude: geoPoint1.latitude, longitude: geoPoint1.longitude },
            { latitude: geoPoint2.latitude, longitude: geoPoint2.longitude }
        );
        // Check if within radius AFTER calculating
        if (distance <= radiusInMeters) {
            return Math.round(distance); // Return the calculated distance (rounded)
        } else {
            return null; // Not within radius
        }
    } catch (e: unknown) {
        functions.logger.error("Error calculating distance:", e);
        return null; // Error during calculation
    }
}

// --- Helper: Generic Match Deletion ---
/**
 * Adds deletion operations for all matches involving a given document ID to a batch.
 * @param {"user" | "room"} docType - Type of the doc triggering deletion.
 * @param {string} docId - ID of the user or room.
 * @param {admin.firestore.WriteBatch} batch - Batch to add operations to.
 * @returns {Promise<number>} Number of deletion operations added.
 */
async function addMatchDeletionsToBatch( /* ... remains the same ... */
    docType: "user" | "room",
    docId: string,
    batch: admin.firestore.WriteBatch
): Promise<number> {
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

// --- Generic Handler Logic (Radius Only, Stores Distance) ---
/**
 * Core logic executed by triggers, performs radius matching and stores distance.
 * @param change - Firestore change object.
 * @param context - Event context.
 * @param primaryType - Type of the triggering document ("user" or "room").
 */
async function handleDocumentWriteRadiusOnly(
    change: functions.Change<functions.firestore.DocumentSnapshot>,
    context: functions.EventContext,
    primaryType: "user" | "room"
): Promise<void> {
    const primaryId = context.params.userId || context.params.roomId;
    const primaryDataAfter = change.after.data();
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

    // --- Proceed with Matching: Coordinates are ESSENTIAL ---
    if (!primaryProfile.coordinates) {
         functions.logger.warn(`Skipping matching for ${primaryType} ${primaryId}: Missing 'coordinates'.`);
         // Optionally delete existing matches if coordinates were removed
         return;
    }

    functions.logger.info(`Radius matching triggered for ${primaryType}: ${primaryId}`);

    try {
        const collectionsToCompare: { type: "user" | "room", name: string }[] = [
            { type: "user", name: USERS_COLLECTION },
            { type: "room", name: ROOMS_COLLECTION },
        ];

        for (const secondary of collectionsToCompare) {
            if (primaryType === "room" && secondary.type === "room") continue;

            functions.logger.info(`Comparing ${primaryType} ${primaryId} with ${secondary.name}...`);

            // ***** FIX START *****
            // Build the query WITHOUT the document ID inequality filter
            const query: admin.firestore.Query = db.collection(secondary.name)
                .where("completedProfile", "==", true)
                .where("coordinates", "!=", null);
            // ***** FIX END *****


            const secondarySnapshot = await query.get();
            functions.logger.info(` -> Found ${secondarySnapshot.size} potential ${secondary.type}(s) with coordinates.`);

            secondarySnapshot.forEach((doc) => {
                const secondaryId = doc.id;

                // ***** FIX START *****
                // Add self-comparison check HERE, inside the loop
                if (primaryType === secondary.type && primaryId === secondaryId) {
                    functions.logger.debug(` ---> Skipping self-comparison: ${primaryId}`);
                    return; // Skip this iteration
                }
                // ***** FIX END *****

                const secondaryProfile = { ...doc.data(), id: secondaryId } as (UserProfile | RoomProfile);

                 // Check secondary coordinates just in case (query should handle this)
                 if (!secondaryProfile.coordinates) {
                     functions.logger.warn(` ---> !!! Skipping ${secondary.type} ${secondaryId} - Missing Coordinates post-query!`);
                     return;
                 }
                 functions.logger.info(` ---> Comparing with ${secondary.type} ${secondaryId}`); // Simplified log


                let matchId: string = "";
                let matchRef: admin.firestore.DocumentReference | null = null;
                let potentialMatchData: UserUserMatch | UserRoomMatch | null = null;
                let distanceResult: number | null = null;

                // Calculate distance and determine match type/ID (Logic remains the same)
                if (primaryType === "user" && secondary.type === "user") {
                    const userA = primaryProfile as UserProfile;
                    const userB = secondaryProfile as UserProfile;
                    distanceResult = getDistanceIfWithinRadius(userA.coordinates, userB.coordinates, MATCH_RADIUS_METERS);
                    const sortedIds = [primaryId, secondaryId].sort();
                    matchId = `user_${sortedIds.join("_")}`;
                    matchRef = db.collection(MATCHES_COLLECTION).doc(matchId);
                    if (distanceResult !== null) { // Check if within radius
                        potentialMatchData = {
                            type: "user-user", uids: [sortedIds[0], sortedIds[1]],
                            user1Loc: sortedIds[0] === primaryId ? userA.location : userB.location,
                            user2Loc: sortedIds[1] === primaryId ? userA.location : userB.location,
                            distance: distanceResult, // Store distance
                            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        };
                    }
                } else if (primaryType === "user" && secondary.type === "room") {
                    const user = primaryProfile as UserProfile;
                    const room = secondaryProfile as RoomProfile;
                    distanceResult = getDistanceIfWithinRadius(user.coordinates, room.coordinates, MATCH_RADIUS_METERS);
                    matchId = `room_${primaryId}_${secondaryId}`;
                    matchRef = db.collection(MATCHES_COLLECTION).doc(matchId);
                    if (distanceResult !== null) {
                        potentialMatchData = {
                            type: "user-room", userId: primaryId, roomId: secondaryId,
                            userLoc: user.location,
                            roomLoc: room.location,
                            distance: distanceResult, // Store distance
                            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        };
                    }
                } else if (primaryType === "room" && secondary.type === "user") {
                    const room = primaryProfile as RoomProfile;
                    const user = secondaryProfile as UserProfile;
                    distanceResult = getDistanceIfWithinRadius(user.coordinates, room.coordinates, MATCH_RADIUS_METERS);
                    matchId = `room_${secondaryId}_${primaryId}`; // User ID first
                    matchRef = db.collection(MATCHES_COLLECTION).doc(matchId);
                     if (distanceResult !== null) {
                        potentialMatchData = {
                            type: "user-room", userId: secondaryId, roomId: primaryId,
                            userLoc: user.location,
                            roomLoc: room.location,
                            distance: distanceResult, // Store distance
                            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        };
                    }
                }

                 functions.logger.info(` ---> Distance Result for ${primaryId}/${secondaryId}: ${distanceResult} (Radius: ${MATCH_RADIUS_METERS})`);


                // Add set or delete operation to batch (Logic remains the same)
                if (matchRef) {
                    if (potentialMatchData) { // If distance was calculated (within radius)
                        functions.logger.info(` -> Match found (Radius): ${primaryId} / ${secondaryId}, Dist: ${distanceResult}m`);
                        batch.set(matchRef, potentialMatchData, { merge: true });
                        opsCount++;
                    } else { // If not within radius
                        functions.logger.debug(` -> No radius match: ${primaryId} / ${secondaryId}. Deleting if exists.`);
                        batch.delete(matchRef);
                        opsCount++;
                    }
                } else {
                     functions.logger.warn(` ---> !!! matchRef was not set for pair ${primaryId}/${secondaryId} (Logic Error?)`);
                 }
            }); // End secondarySnapshot.forEach
        } // End for loop

        // Commit batch if needed (Logic remains the same)
        if (opsCount > 0) {
            await batch.commit();
            functions.logger.info(`Committed ${opsCount} match operations for ${primaryType} ${primaryId}.`);
        } else {
            functions.logger.info(`No matching criteria changes for ${primaryType} ${primaryId}.`);
        }
    } catch (error: unknown) {
        functions.logger.error(`Error during radius matching for ${primaryType} ${primaryId}:`, error);
    }
}


// --- Exported Trigger Functions ---

export const matchOnUserWriteRadiusOnly = functions // Renamed
    .region(FUNCTION_REGION)
    .runWith({ memory: FUNCTION_MEMORY, timeoutSeconds: FUNCTION_TIMEOUT })
    .firestore.document(`${USERS_COLLECTION}/{userId}`)
    .onWrite((change, context) => handleDocumentWriteRadiusOnly(change, context, "user"));

export const matchOnRoomWriteRadiusOnly = functions // Renamed
    .region(FUNCTION_REGION)
    .runWith({ memory: FUNCTION_MEMORY, timeoutSeconds: FUNCTION_TIMEOUT })
    .firestore.document(`${ROOMS_COLLECTION}/{roomId}`)
    .onWrite((change, context) => handleDocumentWriteRadiusOnly(change, context, "room"));