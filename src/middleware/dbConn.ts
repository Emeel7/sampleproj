import { connectDB as cDB } from "../resources/database.js"
import asyncHandler from "express-async-handler"

import { type Request, type Response, type NextFunction } from 'express'

// // ---- CONNECT TO DATABASE
let firestoreReady = false
const connect = async () => {
  if (firestoreReady) return

  try {
    const db = cDB()
    await db.collection('notes').limit(1).get()
    firestoreReady = true
    console.log('Firestore Ready (cached)')
  } catch (err) {
    console.error('Firestore Initialization Error: ', err)
    throw err
  }
}

const connectDB = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    await connect()
    next()
  } catch (err) {
    next(err)
  }
})

export default connectDB