import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";

import { dbGetUserByField, dbGetUserIdentity } from "../models/User/Users.js";
import { ForbiddenError } from "../models/errors/Errors.js";
import cookieNames from "../config/cookies.js";

const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const sessionToken = req.cookies?.[cookieNames.user_cookie_name];

  if (!sessionToken) throw new ForbiddenError();

  const existingUser = await dbGetUserIdentity(
    "auth.sessionToken",
    sessionToken,
  );

  req.identity = existingUser;

  return next();
};

export default authenticate;
