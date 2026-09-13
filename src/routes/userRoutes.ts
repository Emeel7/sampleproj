import express from "express";

const router = express.Router();

import {
  getAllUsers,
  getUserById,
  updateUserField,
  deleteUser,
} from "../controllers/usersController.js";
import authenticate from "../middleware/authenticate.js";

router.get("/", getAllUsers);
router.get("/:id", authenticate, getUserById);
router.patch("/:id", authenticate, updateUserField);
router.delete("/:id", authenticate, deleteUser);

export default router;
