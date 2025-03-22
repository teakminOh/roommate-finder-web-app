import { connectToDatabase } from '~/server/utils/mongodb'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  try {
    const db = await connectToDatabase()
    const collection = db.collection('inzeraty') // Collection name

    const result = await collection.insertOne(body)
    return { message: 'Inzerát uložený úspešne', id: result.insertedId }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to save inzerat: ' + (error as Error).message,
    })
  }
})