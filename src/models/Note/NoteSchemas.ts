import z from "zod";
import { zEnforceNonEmptyStr } from "../../utils/utils.js";

export const fullNoteSchema = z.object({
  title: zEnforceNonEmptyStr("Title"),
  content: zEnforceNonEmptyStr("Content"),
  userId: z.string().trim(),
});

export const inputNoteSchema = fullNoteSchema.omit({ userId: true });
