import { Router } from "express";
import {
  register,
  login,
  getAdmin,
  updateAdmin,
  getAllUsers,
  getSingleUserInfo,
} from "../../controllers/adminapp/v1/auth.controller.js";
import {
  listBooking,
  singleBooking,
  updateBookingStatus,
  getBookingStats,
} from "../../controllers/adminapp/v1/booking.controller.js";
import {
  listPayments,
  singlePayment,
  getAllTotalAmountPaymentPaid,
  updatePaymentStatus,
  getPaymentStats,
} from "../../controllers/adminapp/v1/payments.controller.js";
import { auth } from "../../middlewares/auth.middlewares.js";
import { PLATFORM } from "../../constants.js";

const router = Router();

// Authentication Routes
router.route("/auth/register").post(register);
router.route("/auth/login").post(login);
router.route("/auth/me").get(auth(PLATFORM.ADMINAPP), getAdmin);
router.route("/auth/update").put(auth(PLATFORM.ADMINAPP), updateAdmin);

// User Management Routes
router.route("/users").get(auth(PLATFORM.ADMINAPP), getAllUsers);
router.route("/users/:userId").get(auth(PLATFORM.ADMINAPP), getSingleUserInfo);

// Booking Routes
router.route("/bookings").get(auth(PLATFORM.ADMINAPP), listBooking);
router.route("/bookings/stats").get(auth(PLATFORM.ADMINAPP), getBookingStats);
router
  .route("/bookings/:bookingId")
  .get(auth(PLATFORM.ADMINAPP), singleBooking);
router
  .route("/bookings/:bookingId/status")
  .put(auth(PLATFORM.ADMINAPP), updateBookingStatus);

// Payment Routes
router.route("/payments").get(auth(PLATFORM.ADMINAPP), listPayments);
router.route("/payments/stats").get(auth(PLATFORM.ADMINAPP), getPaymentStats);
router
  .route("/payments/total-amount")
  .get(auth(PLATFORM.ADMINAPP), getAllTotalAmountPaymentPaid);
router
  .route("/payments/:paymentId")
  .get(auth(PLATFORM.ADMINAPP), singlePayment);
router
  .route("/payments/:paymentId/status")
  .put(auth(PLATFORM.ADMINAPP), updatePaymentStatus);

export default router;
