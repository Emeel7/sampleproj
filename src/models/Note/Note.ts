import FirebaseCollectionModel from '../base/CollectionModel.js'
import { z } from 'zod'
import { connectDB } from '../../resources/database.js'
/**
 * Define the schema for a Note.
 * - title: required non-empty string
 * - content: required non-empty string
 * Using Zod for runtime validation.
 */

export const noteSchema = z.object({
    title: zEnforceNonEmptyStr('Title'),
    content: zEnforceNonEmptyStr('Content'),
    userId: z.string().trim()
})

export type NoteType = z.infer<typeof noteSchema>


/**
 * Create a FireBaseModel instance for notes collection.
 * Provides CRUD methods for interacting with Firestore.
*/
export const Note = new FirebaseCollectionModel(connectDB(), 'notes', noteSchema)

/**
 * Helper functions for database operations.
*/
import { type findAllQueryConfig } from '../base/CollectionModel.js'
import { zEnforceNonEmptyStr } from '../../utils/utils.js'

// Retrieve all notes with optional query config 
export const dbGetAllNotes = async (config: findAllQueryConfig) =>
    await Note.findAll(config)

// Retrieve a single note by its ID.
export const dbGetNote = async (id: string) =>
    await Note.findById(id)

// Create and store a new note. Accepts an object matching NoteType
export const dbCreateAndStoreNote = async (note: NoteType) =>
    await Note.create(note)

// Update an existing note by ID. Accepts partial updates validated by FireBaseModel.
export const dbUpdateNote = async (id: string, note: Partial<NoteType>) =>
    await Note.updateById(id, note)

// Delete a note by its ID.
export const dbDeleteNote = async (id: string) =>
    await Note.deleteById(id)
