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
      .limit(1)
      .get();

    // Map through the snapshot to extract the core data
    const users = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        bio: data.bio,
        gender: data.gender,
        age: data.age,
        budget: data.budget,
        firstName: data.firstName,
        location: data.location,
        images: data.images, // retrieves the images field
      };
    });
    

    res.json(users);
  } catch (error) {
    console.error('Error fetching welcome users:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
