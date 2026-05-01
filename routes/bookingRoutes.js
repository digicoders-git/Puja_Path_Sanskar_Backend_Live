const express = require("express");
const {
  getUserBookings,
  getAllBookings,
  updateBookingStatus,
} = require("../controllers/bookingController");
const { Auth, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// User Routes
router.get("/my-bookings", Auth, getUserBookings);

// Admin Routes
router.get("/admin/all", Auth, adminOnly, getAllBookings);
router.patch("/admin/:id/status", Auth, adminOnly, updateBookingStatus);

module.exports = router;
