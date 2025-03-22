import { MongoClient, Db } from 'mongodb'
import { MONGO_URI } from '../config.js'
const uri = MONGO_URI || 'mongodb://localhost:27017'
const client = new MongoClient(uri)
let cachedDb: Db | null = null
const DATABASE_NAME = 'real-estate'

export async function connectToDatabase(): Promise<Db> {
  if (cachedDb) return cachedDb

  try {
    await client.connect()
    const db = client.db(DATABASE_NAME)
    cachedDb = db
    console.log('Connected to MongoDB:', DATABASE_NAME)
    return db
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error)
    throw error
  }
}