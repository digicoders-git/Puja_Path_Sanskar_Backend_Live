const express = require("express");
const {
  createBooking,
  getUserBookings,
  getAllBookings,
  updateBookingStatus,
} = require("../controllers/bookingController");
const { Auth, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// User Routes
router.post("/", Auth, createBooking); // Create booking
router.get("/my-bookings", Auth, getUserBookings); // Get user's own bookings

// Admin Routes
router.get("/admin/all", Auth, adminOnly, getAllBookings); // Get all bookings
router.patch("/admin/:id/status", Auth, adminOnly, updateBookingStatus); // Update status & assign pandit

module.exports = router;
