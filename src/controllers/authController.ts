import cookieNames from "../config/cookies.js";
const USER_SESSION_COOKIE_NAME = cookieNames.user_cookie_name;

import { type CookieOptions, type Request, type Response } from "express";
import {
  dbCreateNewUser,
  dbLoginUser,
  dbLogoutUser,
  dbRefreshUserSessionToken,
  dbUpdateUserPassword,
} from "../models/User/Users.js";
import {
  parseLoginAttempt,
  parseNewUserDetails,
  parseUserId,
  parseUserResetAttempt,
} from "./parsers/userRequestParsers.js";
import { getUserIdentity } from "./parsers/authRequestParsers.js";

// Util
export const shortCookieArgs = (
  sT: string,
  minutes: number = 5,
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
// @route POST /auth/REGISTER
// @access Private
export const registerNewUser = async (req: Request, res: Response) => {
  const newUserDetails = parseNewUserDetails(req.body);

  const { sessionToken, ...newUser } = await dbCreateNewUser(newUserDetails);

  return res
    .cookie(...shortCookieArgs(sessionToken))
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
  const { sessionToken: oldSessionToken } = getUserIdentity(req);

  const { sessionToken } = await dbRefreshUserSessionToken(oldSessionToken);

  return res.cookie(...shortCookieArgs(sessionToken)).sendStatus(204);
};

// @desc Log out
// @route POST /auth/logout
// @access Private
export const logoutUser = async (req: Request, res: Response) => {
  const { sessionToken } = getUserIdentity(req);

  await dbLogoutUser(sessionToken);

  return res.clearCookie(USER_SESSION_COOKIE_NAME!).sendStatus(204);
};

// @desc Update user password
// @route PATCH /auth/update-password
// @access Private
export const updateUserPassword = async (req: Request, res: Response) => {
  const { id } = getUserIdentity(req);

  const { oldPass, newPass } = parseUserResetAttempt(req.body);

  const { sessionToken } = await dbUpdateUserPassword(id, oldPass, newPass);

  return res.cookie(...shortCookieArgs(sessionToken)).sendStatus(204);
};
