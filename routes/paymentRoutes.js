const express = require("express");
const {
  createBookingWithPayment,
  verifyPayment,
  payRemainingAmount,
  verifyRemainingPayment,
} = require("../controllers/paymentController");
const { Auth } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/create-booking", Auth, createBookingWithPayment);  // Step 1: Booking + Razorpay order
router.post("/verify", Auth, verifyPayment);                     // Step 2: 25% payment verify
router.post("/remaining/:bookingId", Auth, payRemainingAmount);  // Step 3: 75% payment order
router.post("/verify-remaining", Auth, verifyRemainingPayment);  // Step 4: 75% payment verify

module.exports = router;
