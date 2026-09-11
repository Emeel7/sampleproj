import type z from "zod";
import type { noteSchema } from "./NoteSchemas.js";

export type NoteSchemaType = typeof noteSchema;

export type NoteType = z.infer<NoteSchemaType>;
