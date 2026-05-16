const express = require("express");
const {
  createBookingWithPayment,
  verifyPayment,
  payRemainingAmount,
  verifyRemainingPayment,
} = require("../controllers/paymentController");
const { Auth, userOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/create-booking", Auth, userOnly, createBookingWithPayment);  // Step 1: Booking + Razorpay order
router.post("/verify", Auth, userOnly, verifyPayment);                     // Step 2: 25% payment verify
router.post("/remaining/:bookingId", Auth, userOnly, payRemainingAmount);  // Step 3: 75% payment order
router.post("/verify-remaining", Auth, userOnly, verifyRemainingPayment);  // Step 4: 75% payment verify

module.exports = router;
