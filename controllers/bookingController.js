const Booking = require("../models/Booking");
const Puja = require("../models/Puja");

// Create a new booking (User App)
const createBooking = async (req, res) => {
  try {
    const { pujaId, panditId, bookingDate, timeSlot, address, amount, specialInstructions } = req.body;

    // Check if puja exists
    const puja = await Puja.findById(pujaId);
    if (!puja) {
      return res.status(404).json({ message: "Puja not found", success: false });
    }

    const booking = new Booking({
      user: req.user.id || req.user._id,
      puja: pujaId,
      pandit: panditId, 
      bookingDate,
      timeSlot,
      address,
      amount,
      specialInstructions,
    });

    await booking.save();
    res.status(201).json({ message: "Booking created successfully", success: true, booking });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

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
      .populate("pandit", "fullName")
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

    // Wallet Logic: If payment is newly marked as "Paid", add amount to Admin wallet
    if (paymentStatus === "Paid" && booking.paymentStatus !== "Paid") {
      const Admin = require("../models/Admin");
      // Find the admin making the request or fallback to first admin
      const adminId = (req.user && (req.user.id || req.user._id)) || (req.admin && req.admin.id);
      let admin = null;
      if (adminId) {
        admin = await Admin.findById(adminId);
      }
      if (!admin) {
        admin = await Admin.findOne(); // Fallback if admin ID not found
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
  createBooking,
  getUserBookings,
  getAllBookings,
  updateBookingStatus,
};
