import cookieNames from "../config/cookies.js";
const USER_SESSION_COOKIE_NAME = cookieNames.user_cookie_name;

import { type CookieOptions, type Request, type Response } from "express";
import {
  dbCreateNewUser,
  dbLoginUser,
  dbUpdateUserSessionToken,
} from "../models/User/Users.js";
import {
  parseLoginAttempt,
  parseNewUserDetails,
  parseUserId,
} from "./parsers/userRequestParsers.js";

// Util
const shortCookieArgs = (
  sT: string,
  minutes: number = 15,
): [string, string, CookieOptions] => {
  return [
    USER_SESSION_COOKIE_NAME!,
    sT,
    {
      maxAge: minutes * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    } satisfies CookieOptions,
  ];
};

// // -------- ROUTES

// @desc Register a new user
// @route POST /auth/signup
// @access Private
export const registerNewUser = async (req: Request, res: Response) => {
  const newUserDetails = parseNewUserDetails(req.body);

  const newUser = await dbCreateNewUser(newUserDetails);

  return res
    .cookie(...shortCookieArgs(newUser.sessionToken))
    .status(201)
    .json(newUser);
};

// @desc Log in
// @route POST /auth/login
// @access Private
export const loginUser = async (req: Request, res: Response) => {
  const {
    method,
    data: { identifier, password },
  } = parseLoginAttempt(req.body);

  const user = await dbLoginUser(method, identifier, password);

  return res.cookie(...shortCookieArgs(user.sessionToken)).sendStatus(204);
};

// @desc Refresh a session token
// @route POST /auth/refresh
// @access Private
export const refreshSessionToken = async (req: Request, res: Response) => {
  const userId = parseUserId(req.body);

  const { sessionToken } = await dbUpdateUserSessionToken(userId);

  return res.cookie(...shortCookieArgs(sessionToken)).sendStatus(204);
};
