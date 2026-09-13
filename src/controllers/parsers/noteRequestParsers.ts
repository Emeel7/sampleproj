import { type Request } from "express";
import {
  BadRequestError,
  ValidationError,
} from "../../models/errors/Errors.js";
import { type findAllQueryConfig } from "../../models/Base/CollectionModel.js";
import z from "zod";
import {
  throwNonObjects,
  stripUndefinedFields,
  parseString,
} from "../../utils/generalUtils.js";
import type {
  FullNoteType,
  NewNoteInputType,
} from "../../models/Note/note.types.js";
import {
  fullNoteSchema,
  inputNoteSchema,
} from "../../models/Note/NoteSchemas.js";

export const findAllQueryParams = z.object({
  startDocId: z.string().trim().optional(),
  limit: z.coerce.number<number>().optional(),
  order: z.literal(["asc", "desc"]).optional(),
});

export const parseNoteId = (body: string | string[] | undefined) => {
  return parseString(body, "note");
};

export const parseNoteData = (
  body: Request["body"],
): NewNoteInputType | never => {
  const bodyAsObject = throwNonObjects(body);

  const result = inputNoteSchema.safeParse(bodyAsObject);

  if (!result.success) {
    throw new ValidationError(result.error.message);
  }

  return result.data;
};

export const parseNoteDataPartial = (
  body: Request["body"],
): Partial<FullNoteType> | never => {
  const bodyAsObject = throwNonObjects(body);

  const strippedObject = stripUndefinedFields(bodyAsObject);

  if (!Object.keys(strippedObject).length) {
    throw new ValidationError("Nothing to update");
  }

  const result = fullNoteSchema.partial().safeParse(strippedObject);

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
