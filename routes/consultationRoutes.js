const express = require("express");
const router = express.Router();
const consultationController = require("../controllers/consultationController");
const { Auth, adminOnly, userOnly } = require("../middleware/authMiddleware");

// App routes
router.post("/", Auth, consultationController.createBooking);
router.get("/my-bookings", Auth, consultationController.getUserBookings);

// Admin routes
router.get("/admin/all", consultationController.getAllBookings);
router.put("/:id", consultationController.updateBookingStatus);

module.exports = router;
