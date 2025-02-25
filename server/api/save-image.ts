import { connectToDatabase } from '../utils/mongodb';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const imageUrl = body.url;

  if (!imageUrl) {
    throw createError({ statusCode: 400, message: 'Image URL is required' });
  }

  const db = await connectToDatabase();
  const collection = db.collection('images');
  await collection.insertOne({ url: imageUrl, createdAt: new Date() });

  return { message: 'Image URL saved to MongoDB' };
});