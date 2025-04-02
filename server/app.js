import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from '../config/serviceAccountKey.json' with { type: 'json' };

// Initialize Firebase Admin SDK
initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = getFirestore();
const app = express();

app.use(cors());

// Endpoint to fetch a few users for the welcome page
app.get('/welcome-users', async (req, res) => {
  try {
    // Query for users with a completed profile.
    const snapshot = await db.collection('users')
      .where('completedProfile', '==', true)
      .limit(6)
      .get();

    // Map through the snapshot to extract the core data
    const users = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data
      };
    });
    
    

    res.json(users);
  } catch (error) {
    console.error('Error fetching welcome users:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to fetch a few rooms for the welcome page
app.get('/welcome-rooms', async (req, res) => {
  try {
    // Query for rooms, ordering by updatedAt (newest first) and limiting to 5.
    const snapshot = await db.collection('rooms')
      .orderBy('updatedAt', 'desc')
      .limit(6)
      .get();

    // Map through the snapshot to extract the core data
    const rooms = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data
      };
    });

    res.json(rooms);
  } catch (error) {
    console.error('Error fetching welcome rooms:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/:collection', async (req, res) => {
  const validCollections = ['rooms', 'users'];
  const { collection } = req.params;

  // Validate the requested collection.
  if (!validCollections.includes(collection)) {
    return res.status(400).json({ error: 'Invalid collection specified.' });
  }

  try {
    // Get the limit (default to 10) and the cursor from the query parameters.
    const limit = parseInt(req.query.limit, 10) || 10;
    const lastDocId = req.query.lastDocId;

    // Start with the base query, ordering by 'updatedAt'.
    let query = db.collection(collection)
      .orderBy('updatedAt', 'desc')
      .limit(limit);

    // If a cursor (lastDocId) is provided, fetch its snapshot and start after it.
    if (lastDocId) {
      const lastDocSnapshot = await db.collection(collection).doc(lastDocId).get();
      if (!lastDocSnapshot.exists) {
        return res.status(400).json({ error: 'Invalid cursor provided.' });
      }
      query = query.startAfter(lastDocSnapshot);
    }

    // Execute the query.
    const snapshot = await query.get();

    // Map documents to plain objects.
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Prepare the next page cursor if there are as many docs as the limit.
    let nextPageToken = null;
    if (snapshot.docs.length === limit) {
      nextPageToken = snapshot.docs[snapshot.docs.length - 1].id;
    }

    // Return the data with the key matching the collection.
    res.json({ [collection]: items, nextPageToken });
  } catch (error) {
    console.error(`Error fetching ${collection}:`, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/:object', async (req, res) => {
  const validCollections = ['rooms', 'users'];
  const { object } = req.params;
  const { uid } = req.query;

  // Validate the requested object
  if (!validCollections.includes(object)) {
    return res.status(400).json({ error: 'Invalid object specified.' });
  }

  // Ensure UID is provided
  if (!uid) {
    return res.status(400).json({ error: 'UID is required.' });
  }

  try {
    const fieldToQuery = object === 'users' ? 'uid' : 'ownerId';

    const query = db.collection(object) // Fixed from db.object to db.collection
      .where(fieldToQuery, '==', uid)
      .limit(1);

    const snapshot = await query.get();

    if (snapshot.empty) {
      return res.status(404).json({ error: `${object.slice(0, -1)} not found for UID: ${uid}` });
    }

    const doc = snapshot.docs[0];
    const item = {
      id: doc.id,
      ...doc.data(),
    };

    res.json({ [object.slice(0, -1)]: item });
  } catch (error) {
    console.error(`Error fetching ${object} by UID:`, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
