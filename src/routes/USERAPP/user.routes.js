import { Router } from "express";
import {
  forgotPassword,
  getUser,
  login,
  logout,
  register,
  resetPasswordHandler,
  sendOTPHandler,
} from "../../controllers/userapp/v1/auth.Controller.js";
import { auth } from "../../middlewares/auth.middlewares.js";
import { PLATFORM } from "../../constants.js";

const router = Router();

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/me").get(auth(PLATFORM.USERAPP), getUser);
router.route("/send-otp").put(sendOTPHandler);
router.route("/forgot-password").put(forgotPassword);
router.route("/reset-password").put(auth(PLATFORM.USERAPP), resetPasswordHandler);
router.route("/logout").post(auth(PLATFORM.USERAPP), logout);
export default router;
