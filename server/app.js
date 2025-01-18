import express from 'express';
import { MongoClient } from 'mongodb';
import { MONGO_URI } from './config.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Check if MONGO_URI is defined
if (!MONGO_URI) {
  console.error('MONGO_URI environment variable is not defined.');
  process.exit(1);
}

const DATABASE_NAME = 'real-estate';
const COLLECTION_NAME = 'properties';

// MongoDB client and connection
const client = new MongoClient(MONGO_URI);

let db; // To store the database connection

// Middleware
app.use(express.json());

// Establish MongoDB connection once during app startup
client.connect()
  .then(() => {
    db = client.db(DATABASE_NAME);
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  });

// Endpoint to fetch properties with optional filtering by address
app.get('/properties', async (req, res) => {
  try {
    const collection = db.collection(COLLECTION_NAME);

    // Optional filtering by address
    const filter = {};
    if (req.query.address) {
      filter.address = { $regex: req.query.address, $options: 'i' }; // Case-insensitive search
    }

    const properties = await collection.find(filter).toArray();
    res.json(properties);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing MongoDB connection...');
  await client.close();
  console.log('MongoDB connection closed.');
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
