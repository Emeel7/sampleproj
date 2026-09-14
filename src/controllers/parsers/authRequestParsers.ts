import type { Request } from "express";
import { ForbiddenError } from "../../models/errors/Errors.js";

export const getUserIdentity = (req: Request) => {
  if (!req.identity) throw new ForbiddenError();

  return req.identity;
};
