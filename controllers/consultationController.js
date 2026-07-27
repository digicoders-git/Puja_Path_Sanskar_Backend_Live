const ConsultationBooking = require("../models/ConsultationBooking");

// Create Consultation Booking (App)
exports.createBooking = async (req, res) => {
  try {
    const { astrologer, problemDescription, bookingDate } = req.body;
    const user = req.user.id || req.user._id;

    const booking = new ConsultationBooking({
      user,
      astrologer,
      problemDescription,
      bookingDate: bookingDate || new Date(),
    });

    await booking.save();
    res.status(201).json({ success: true, message: "Booking created successfully", booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get User's Bookings (App)
exports.getUserBookings = async (req, res) => {
  try {
    const user = req.user.id || req.user._id;
    const bookings = await ConsultationBooking.find({ user })
      .populate("astrologer", "name specialty emoji")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all Bookings (Admin)
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await ConsultationBooking.find()
      .populate("user", "name email mobile dateOfBirth")
      .populate("astrologer", "name specialty")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Booking Status (Admin)
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    const booking = await ConsultationBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    if (status) booking.status = status;
    if (paymentStatus) booking.paymentStatus = paymentStatus;

    await booking.save();
    res.status(200).json({ success: true, message: "Booking updated", booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
