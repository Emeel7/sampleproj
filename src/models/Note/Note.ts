import FirebaseCollectionModel from "../Base/CollectionModel.js";
import { connectDB } from "../../resources/database.js";

export class NoteModel extends FirebaseCollectionModel<
  "notes",
  NoteSchemaType
> {
  constructor() {
    super(connectDB(), "notes", noteSchema);
  }

  async findAllFromUser(qry: findAllQueryConfig, userId: string) {
    const { order = "asc", limit = 50, startDocId } = qry;

    let query = this.ref()
      .where("userId", "==", userId)
      .orderBy("createdAt", order)
      .limit(limit);

    if (startDocId) {
      const startDocSnap = await this.getDocOrThrow(startDocId);
      query = query.startAfter(startDocSnap);
    }

    const snap = await query.get();
    return snap.docs.map((d) => this.format(d));
  }

  override async findAll(qry: findAllQueryConfig): Promise<never> {
    throw new ForbiddenError();
  }
}

export const Note = new NoteModel();

/**
 * Helper functions for database operations.
 */
import { type findAllQueryConfig } from "../Base/CollectionModel.js";
import type { NoteSchemaType, NoteType } from "./note.types.js";
import { noteSchema } from "./NoteSchemas.js";
import { ForbiddenError } from "../errors/Errors.js";

// Retrieve all notes with optional query config
export const dbGetAllNotesFromUser = async (
  config: findAllQueryConfig,
  userId: string,
) => await Note.findAllFromUser(config, userId);

// Retrieve a single note by its ID.
export const dbGetNote = async (id: string) => await Note.findById(id);

// Create and store a new note. Accepts an object matching NoteType
export const dbCreateAndStoreNote = async (note: NoteType) =>
  await Note.create(note);

// Update an existing note by ID. Accepts partial updates validated by FireBaseModel.
export const dbUpdateNote = async (id: string, note: Partial<NoteType>) =>
  await Note.updateById(id, note);

// Delete a note by its ID.
export const dbDeleteNote = async (id: string) => await Note.deleteById(id);
