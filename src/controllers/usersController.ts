import { type Request, type Response } from "express";
import {
  dbGetAllUsers,
  dbUpdateUserByField,
  dbDeleteUser,
  dbGetUserById,
  dbUpdateUserPassword,
} from "../models/User/Users.js";

// // -------- UTIL
import {
  parseUserId,
  parseUserResetAttempt,
  parseUserUpdateAttempt,
} from "./parsers/userRequestParsers.js";

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

  const user = await dbGetUserById(userId);

  return res.status(200).json(user);
};

// @desc Update user email or username
// @route PATCH /users/:id
// @access Private
// FIX SOMETHING *************
export const updateUserField = async (req: Request, res: Response) => {
  const id = parseUserId(req.params.id);

  const { method: field, data: newValue } = parseUserUpdateAttempt(req.body);

  await dbUpdateUserByField(field, newValue, id);

  return res.status(200);
};

// @desc Update user password
// @route PATCH /users/:id/password
// @access Private
export const updateUserPassword = async (req: Request, res: Response) => {
  const id = parseUserId(req.params.id);

  const { oldPass, newPass } = parseUserResetAttempt(req.body);

  const { sessionToken } = await dbUpdateUserPassword(id, oldPass, newPass);

  return res.status(200).json({ sessionToken });
};

// @desc Delete user
// @route DELETE /users/:id
// @access Private
export const deleteNote = async (req: Request, res: Response) => {
  const id = parseUserId(req.params.id);

  const result = await dbDeleteUser(id);

  return res.sendStatus(204).json(result);
};
