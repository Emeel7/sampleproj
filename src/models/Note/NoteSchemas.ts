import z from "zod";
import { zEnforceNonEmptyStr } from "../../utils/utils.js";

export const noteSchema = z.object({
  title: zEnforceNonEmptyStr("Title"),
  content: zEnforceNonEmptyStr("Content"),
  userId: z.string().trim(),
});
