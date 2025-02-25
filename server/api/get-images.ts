import { connectToDatabase } from '../utils/mongodb';

export default defineEventHandler(async () => {
  const db = await connectToDatabase();
  const collection = db.collection('images');
  const images = await collection.find({}).toArray();
  return images;
});