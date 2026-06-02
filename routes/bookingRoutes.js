const express = require("express");
const {
  createBooking,
  getUserBookings,
  getAllBookings,
  updateBookingStatus,
} = require("../controllers/bookingController");
const { Auth, adminOnly, userOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// User Routes
router.post("/", Auth, userOnly, createBooking);
router.get("/my-bookings", Auth, userOnly, getUserBookings);

// Admin Routes
router.get("/admin/all", Auth, adminOnly, getAllBookings);
router.patch("/admin/:id/status", Auth, adminOnly, updateBookingStatus);

module.exports = router;
