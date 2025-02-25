import { adminAuth } from '~/server/utils/firebase-admin'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { uid } = body

  if (!uid) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing UID',
    })
  }

  try {
    const verificationLink = await adminAuth.generateEmailVerificationLink(uid)
    return { link: verificationLink }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate verification link: ' + (error as Error).message,
    })
  }
})