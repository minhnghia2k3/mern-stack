import express from "express";
const router = express.Router();

import {
  register,
  login,
  forgotPassword,
  resetPassword,
} from "../controllers/auth";

/**Routes */

router.post("/register", register);
router.post("/login", login);
router.post("/forgotpassword", forgotPassword);
router.post("/resetpassword/:resetToken", resetPassword);

export default router;
