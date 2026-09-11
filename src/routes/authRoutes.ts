import express from "express";
const router = express.Router();

import {
  loginUser,
  registerNewUser,
  refreshSessionToken,
} from "../controllers/authController.js";
import authenticate from "../middleware/authenticate.js";

router.post("/register", registerNewUser);
router.post("/login", loginUser);
router.post("/refresh", authenticate, refreshSessionToken);

export default router;
