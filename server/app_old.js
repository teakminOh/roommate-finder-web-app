import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import { MONGO_URI } from './config.js';

const app = express();
app.use(cors()); // Enable CORS for all origins

const DATABASE_NAME = 'real-estate';
const PROPERTIES_COLLECTION = 'properties';
const INZERATY_COLLECTION = 'inzeraty';
const client = new MongoClient(MONGO_URI);

app.get('/properties', async (req, res) => {
  try {
    await client.connect(); // Connect to Atlas MongoDB
    const db = client.db(DATABASE_NAME);

    const { address, sort = 'date', order = 'desc', limit = 10, skip = 0 } = req.query;
    const limitNumber = parseInt(limit, 10);
    const skipNumber = parseInt(skip, 10);
    
    let cityName = '';
    let postalCode = '';

    if (address) {
      const parts = address.split(',');
      const location = parts[0].trim();
      const firstSpaceIndex = location.indexOf(' ');
      if (firstSpaceIndex !== -1) {
        postalCode = location.slice(0, firstSpaceIndex + 3).trim(); // Extract postal code
        cityName = location.slice(firstSpaceIndex + 3).trim();      // Extract city name
      } else {
        cityName = location; // Use the entire location if no spaces are found
      }
    }
    console.log('cityName:', cityName);
    console.log('postalCode:', postalCode);
    
    // Build filter based on the provided address
    let filter = postalCode
      ? { location: { $regex: `\\b${postalCode}\\b`, $options: 'i' } }
      : { location: { $regex: cityName, $options: 'i' } };

    // Sorting order
    const sortOrder = { [sort]: order === 'asc' ? 1 : -1, _id: 1 };

    // Build aggregation pipeline using $unionWith to combine both collections
    const pipeline = [
      { $match: filter },
      {
        $unionWith: {
          coll: INZERATY_COLLECTION,
          pipeline: [{ $match: filter }]
        }
      },
      { $sort: sortOrder },
      { $skip: skipNumber },
      { $limit: limitNumber }
    ];

    // Run the aggregation on the 'properties' collection to union with 'inzeraty'
    const combinedResults = await db.collection(PROPERTIES_COLLECTION).aggregate(pipeline).toArray();

    // Get total count from both collections (for pagination metadata)
    const countProperties = await db.collection(PROPERTIES_COLLECTION).countDocuments(filter);
    const countInzeraty = await db.collection(INZERATY_COLLECTION).countDocuments(filter);
    const totalCount = countProperties + countInzeraty;
    console.log('totalCount:', totalCount);

    // Respond with the combined properties and pagination metadata
    res.json({
      properties: combinedResults,
      totalCount,
      currentPage: Math.floor(skipNumber / limitNumber) + 1,
      totalPages: Math.ceil(totalCount / limitNumber)
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
    // Define sorting order and limit
    const limit = 3;
    const sortOrder = { date: -1 };
    
    // Aggregation pipeline to combine both collections and then sort/limit
    const pipeline = [
      { $match: {} },
      {
        $unionWith: {
          coll: INZERATY_COLLECTION,
          pipeline: [{ $match: {} }]
        }
      },
      {
        $addFields: {
          normalizedDate: {
            $cond: {
              if: { $regexMatch: { input: "$date", regex: /^\[.*\]$/ } },
              then: {
                $dateFromString: {
                  dateString: { $trim: { input: "$date", chars: "[]" } },
                  format: "%d.%m. %Y",
                  onError: null,
                  onNull: null
                }
              },
              else: {
                $dateFromString: {
                  dateString: "$date",
                  onError: null,
                  onNull: null
                }
              }
            }
          }
        }
      },
      { $sort: { normalizedDate: -1 } },
      { $limit: limit }
    ];
    
    
    
    // Run the pipeline on the 'properties' collection
    const previewProperties = await db.collection(PROPERTIES_COLLECTION).aggregate(pipeline).toArray();
    res.json(previewProperties);
  } catch (error) {
    console.error('Error fetching preview properties:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
