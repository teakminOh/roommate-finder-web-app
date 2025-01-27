import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import { MONGO_URI } from './config.js';

const app = express();
app.use(cors()); // Enable CORS for all origins

const DATABASE_NAME = 'real-estate';
const COLLECTION_NAME = 'properties';
const client = new MongoClient(MONGO_URI);


app.get('/properties', async (req, res) => {
  try {
    await client.connect(); // Connect to Atlas MongoDB
    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);

    const { address, sort = 'date', order = 'desc', limit = 10, skip = 0 } = req.query;
    const limitNumber = parseInt(limit, 10);
    const skipNumber = parseInt(skip, 10);

    let fullLocation = '';
    if (address) {
      const parts = address.split(',');
      const location = parts[0].trim();
      const postalCode = location.slice(0, 6).trim();
      const city = location.slice(location.indexOf(' ') + 3).trim();

      if (postalCode && city) {
        fullLocation = `${city} ${postalCode}`;
      }
    }

    // MongoDB filter
    const filter = fullLocation
      ? { location: { $regex: `^${fullLocation}`, $options: 'i' } }
      : {};

    const sortOrder = { [sort]: order === 'asc' ? 1 : -1 };

    // Fetch total count for pagination
    const totalCount = await collection.countDocuments(filter);

    // Fetch properties with limit and skip for pagination
    const properties = await collection
      .find(filter)
      .sort(sortOrder)
      .skip(skipNumber)
      .limit(limitNumber)
      .toArray();

    // If no properties are returned, indicate no more pages
    if (properties.length === 0 && skipNumber > 0) {
      return res.json({
        properties: [],
        totalCount,
        currentPage: Math.floor(skipNumber / limitNumber) + 1,
        totalPages: Math.ceil(totalCount / limitNumber),
        noMoreProperties: true,
      });
    }

    // Respond with properties and pagination metadata
    res.json({
      properties,
      totalCount,
      currentPage: Math.floor(skipNumber / limitNumber) + 1,
      totalPages: Math.ceil(totalCount / limitNumber),
    });
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/preview-properties', async (req, res) => {
  try {
    await client.connect();
    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Limit to a few properties, sorted by date
    const limit = 3; // Adjust the limit for preview
    const sortOrder = { date: -1 }; // Sort by date in descending order

    // Fetch properties sorted by date
    const properties = await collection.find().sort(sortOrder).limit(limit).toArray();

    res.json(properties);
  } catch (error) {
    console.error('Error fetching preview properties:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
