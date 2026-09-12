import FirebaseCollectionModel from "../Base/CollectionModel.js";
import { connectDB } from "../../resources/database.js";
import { type findAllQueryConfig } from "../Base/CollectionModel.js";
import type { NoteSchemaType, FullNoteType } from "./note.types.js";
import { fullNoteSchema } from "./NoteSchemas.js";
import { ForbiddenError } from "../errors/Errors.js";
import type { DocSnapType, DbDocData } from "../Base/base.types.js";

export class NoteModel extends FirebaseCollectionModel<
  "notes",
  NoteSchemaType
> {
  constructor() {
    super(connectDB(), "notes", fullNoteSchema);
  }

  async findAllFromUser(
    qry: findAllQueryConfig,
    userId: string,
  ): Promise<DbDocData<NoteSchemaType>[]>;
  async findAllFromUser(
    qry: findAllQueryConfig,
    userId: string,
    opts?: { dbDoc: true },
  ): Promise<
    FirebaseFirestore.QueryDocumentSnapshot<
      FirebaseFirestore.DocumentData,
      FirebaseFirestore.DocumentData
    >[]
  >;
  async findAllFromUser(
    qry: findAllQueryConfig,
    userId: string,
    opts?: { dbDoc: true },
  ) {
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

    if (!opts) {
      return snap.docs.map((d) => this.format(d));
    }

    if ("dbDoc" in opts && opts.dbDoc) {
      return snap.docs;
    }
  }

  async deleteAllFromUser(userId: string) {
    const noteSnaps = await this.findAllFromUser({ limit: 3000 }, userId, {
      dbDoc: true,
    });

    await this.deleteMany(noteSnaps);

    return { success: true, deletedCount: noteSnaps.length };
  }

  override async findAll(qry: findAllQueryConfig): Promise<never> {
    throw new ForbiddenError();
  }
}

export const Note = new NoteModel();

// Retrieve all notes with optional query config
export const dbGetAllNotesFromUser = async (
  config: findAllQueryConfig,
  userId: string,
) => await Note.findAllFromUser(config, userId);

// Retrieve a single note by its ID.
export const dbGetNote = async (id: string) => await Note.findById(id);

// Create and store a new note. Accepts an object matching NoteType
export const dbCreateAndStoreNote = async (note: FullNoteType) =>
  await Note.create(note);

// Update an existing note by ID. Accepts partial updates validated by FireBaseModel.
export const dbUpdateNote = async (id: string, note: Partial<FullNoteType>) =>
  await Note.updateById(id, note);

// Delete a note by its ID.
export const dbDeleteNote = async (id: string) => await Note.deleteById(id);
