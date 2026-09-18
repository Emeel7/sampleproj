import { type Request, type Response } from "express";
import {
  dbGetAllUsers,
  dbUpdateUserByField,
  dbDeleteUser,
  dbGetUserById,
} from "../models/User/Users.js";
import cookieNames from "../config/cookies.js";
// // -------- UTIL
import {
  parseUserDeleteAttempt,
  parseUserId,
  parseUserUpdateAttempt,
} from "./parsers/userRequestParsers.js";

import { getUserIdentity } from "./parsers/authRequestParsers.js";
import { ForbiddenError } from "../models/errors/Errors.js";
// // -------- ROUTES

// @desc Get all users
// @route GET /users
// @access Private
export const getAllUsers = async (req: Request, res: Response) => {
  const users = await dbGetAllUsers();

  return res.status(200).json(users);
};

// @desc Get user by id
// @route GET /users/:id
// @access Private
export const getUserById = async (req: Request, res: Response) => {
  const userId = parseUserId(req.params.id);

  const { id: updaterId } = getUserIdentity(req);

  if (updaterId !== userId) throw new ForbiddenError();

  const user = await dbGetUserById(userId);

  return res.status(200).json(user);
};

// @desc Update user email or username
// @route PATCH /users/:id
// @access Private
export const updateUserField = async (req: Request, res: Response) => {
  const userId = parseUserId(req.params.id);

  const { id: updaterId } = getUserIdentity(req);

  if (updaterId !== userId) throw new ForbiddenError();

  const { method: field, data: newValue } = parseUserUpdateAttempt(req.body);

  await dbUpdateUserByField(field, newValue, userId);

  return res
    .status(200)
    .json({ success: true, message: `User ${field} updated successfully` });
};

// @desc Delete user
// @route DELETE /users/:id
// @access Private
export const deleteUser = async (req: Request, res: Response) => {
  const { id } = getUserIdentity(req);

  const { password } = parseUserDeleteAttempt(req.body);

  const result = await dbDeleteUser(id, password);

  return res.clearCookie(cookieNames.user_cookie_name).status(200).json(result);
};
