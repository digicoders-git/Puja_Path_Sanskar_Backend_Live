const Booking = require("../models/Booking");
const Puja = require("../models/Puja");

// Get all bookings for a specific user (User App)
const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id || req.user._id })
      .populate("puja", "pujaType image priceRange")
      .populate("pandit", "fullName mobileNumber")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

// Get all bookings (Admin Panel)
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "name mobile")
      .populate("puja", "pujaType")
      .populate("pandit", "fullName mobileNumber")
      .populate("offer", "title discountType discountValue")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

// Update booking status (Admin Panel)
const updateBookingStatus = async (req, res) => {
  try {
    const { status, paymentStatus, panditId } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found", success: false });
    }

    // Wallet Logic: If payment is newly marked as "FullyPaid", add amount to Admin wallet
    if (paymentStatus === "FullyPaid" && booking.paymentStatus !== "FullyPaid") {
      const Admin = require("../models/Admin");
      const adminId = (req.user && (req.user.id || req.user._id)) || (req.admin && req.admin.id);
      let admin = null;
      if (adminId) {
        admin = await Admin.findById(adminId);
      }
      if (!admin) {
        admin = await Admin.findOne();
      }
      if (admin) {
        admin.walletBalance = (admin.walletBalance || 0) + booking.amount;
        await admin.save();
      }
    }

    if (status) booking.status = status;
    if (paymentStatus) booking.paymentStatus = paymentStatus;
    if (panditId) booking.pandit = panditId; // Assigning pandit

    await booking.save();
    res.status(200).json({ message: "Booking updated successfully", success: true, booking });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

module.exports = {
  getUserBookings,
  getAllBookings,
  updateBookingStatus,
};
