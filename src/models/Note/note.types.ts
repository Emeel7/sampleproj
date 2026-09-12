import type z from "zod";
import type { fullNoteSchema } from "./NoteSchemas.js";

export type NoteSchemaType = typeof fullNoteSchema;

export type FullNoteType = z.infer<NoteSchemaType>;

export type NewNoteInputType = Omit<FullNoteType, "userId">;
