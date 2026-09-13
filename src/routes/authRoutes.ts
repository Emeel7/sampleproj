import express from "express";
const router = express.Router();

import {
  loginUser,
  registerNewUser,
  refreshSessionToken,
  logoutUser,
  updateUserPassword,
} from "../controllers/authController.js";
import authenticate from "../middleware/authenticate.js";

router.post("/register", registerNewUser);
router.post("/login", loginUser);
router.post("/refresh", authenticate, refreshSessionToken);
router.post("/logout", authenticate, logoutUser);
router.post("/update-password", authenticate, updateUserPassword);

/* 
Future routes:
/reset-password
*/
export default router;
