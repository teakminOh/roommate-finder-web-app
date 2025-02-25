import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);
let cachedDb: Db | null = null;
const DATABASE_NAME = 'real-estate';


export async function connectToDatabase() {
  if (cachedDb) return cachedDb;
  await client.connect();
  const db = client.db(DATABASE_NAME);
  cachedDb = db;
  return db;
}