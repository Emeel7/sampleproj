import { type Request } from "express";
import {
  BadRequestError,
  ForbiddenError,
  ValidationError,
} from "../../models/errors/Errors.js";
import { type findAllQueryConfig } from "../../models/base/CollectionModel.js";
import z from "zod";
import {
  throwNonObjects,
  stripUndefinedFields,
  parseId,
} from "../../utils/generalUtils.js";
import type { NoteType } from "../../models/Note/note.types.js";
import { noteSchema } from "../../models/Note/NoteSchemas.js";

export const findAllQueryParams = z.object({
  startDocId: z.string().trim().optional(),
  limit: z.coerce.number<number>().optional(),
  order: z.literal(["asc", "desc"]).optional(),
});

export const parseNoteId = (body: string | string[] | undefined) => {
  return parseId(body, "note");
};

export const parseNoteData = (body: Request["body"]): NoteType | never => {
  const bodyAsObject = throwNonObjects(body);

  const result = noteSchema.safeParse(bodyAsObject);

  if (!result.success) {
    throw new ValidationError(result.error.message);
  }

  return result.data;
};

export const parseNoteDataPartial = (
  body: Request["body"],
): Partial<NoteType> | never => {
  const bodyAsObject = throwNonObjects(body);

  const strippedObject = stripUndefinedFields(bodyAsObject);

  if (!Object.keys(strippedObject).length) {
    throw new ValidationError("Nothing to update");
  }

  const result = noteSchema.partial().safeParse(strippedObject);

  if (!result.success) {
    throw new ValidationError(result.error.message);
  }

  return result.data as any;
};

export const parseQuery = (
  qry: Request["query"],
): findAllQueryConfig | never => {
  const result = findAllQueryParams.partial().safeParse(qry);

  if (!result.success) {
    throw new BadRequestError(result.error.message);
  }

  const stripped = stripUndefinedFields(result.data);

  return stripped;
};

export const getUserIdentity = (req: Request) => {
  if (!req.identity) throw new ForbiddenError();

  return req.identity;
};
