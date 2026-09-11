import z from "zod";
import type {
  DbDocData,
  DocSnapType,
  Infer,
  Parsed,
  ParsedPartial,
} from "../models/base/base.types.js";
import {
  ConflictError,
  DocumentNotFoundError,
  ValidationError,
} from "../models/errors/Errors.js";

export const zEnforceNonEmptyStr = (fieldName?: string) =>
  z
    .string()
    .trim()
    .min(1, { error: `${fieldName || "Field"} must be a non-empty string` });

export function parseSchema<T extends z.ZodType, B extends string>(
  schema: T,
  data: unknown,
  brand: B,
) {
  const result = schema.safeParse(data);

  if (result.success) {
    return {
      ...result,
      brand,
      data: result.data as Parsed<T, B>,
    };
  }

  throw new ValidationError(result.error.message);
}

export function parseObjectPartial<T extends z.ZodObject, B extends string>(
  schema: T,
  data: unknown,
  brand: B,
) {
  const result = schema.partial().safeParse(data);

  if (result.success) {
    return {
      ...result,
      brand,
      data: result.data as ParsedPartial<T, B>,
    };
  }

  throw new ValidationError(result.error.message);
}

export function formatDbSnap<
  T extends z.ZodObject,
  const K extends readonly (keyof Infer<T>)[] = [],
>(
  d: DocSnapType,
  opts?: {
    omit?: K;
  },
): DbDocType<T, K[number]> {
  if (!d.exists) {
    throw new DocumentNotFoundError(
      `Document with id ${d.id} somehow does not exist`,
    );
  }

  const data = d.data() as DbDocData<T>;

  const cleaned = opts?.omit
    ? Object.fromEntries(
        Object.entries(data).filter(
          ([k]) => !(opts.omit as readonly string[]).includes(k),
        ),
      )
    : data;

  return {
    id: d.id,
    ...cleaned,
  } as DbDocType<T, K[number]>;
}

export function isFirestoreError(
  e: unknown,
): e is { code: unknown; message?: unknown; details?: string } {
  return typeof e === "object" && e !== null && "code" in e;
}
