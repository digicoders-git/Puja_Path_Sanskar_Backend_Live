const Booking = require("../models/Booking");
const Puja = require("../models/Puja");
const Pandit = require("../models/Pandit");
const Address = require("../models/Address");

// Create a new booking (User App)
const createBooking = async (req, res) => {
  try {
    const { pujaId, panditId, bookingDate, timeSlot, samagriOption, addressId, specialInstructions } = req.body;

    if (!pujaId || !bookingDate || !timeSlot || !addressId) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Resolve Address
    const addressDoc = await Address.findById(addressId);
    if (!addressDoc) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }
    const formattedAddress = `${addressDoc.houseFlatNo}, ${addressDoc.streetArea}, ${addressDoc.city}, ${addressDoc.state} - ${addressDoc.pincode}`;

    // Get Base Price
    let basePrice = 0;
    if (panditId) {
      const pandit = await Pandit.findById(panditId);
      if (pandit && pandit.selectedPujas) {
        const selectedPuja = pandit.selectedPujas.find(p => p.puja.toString() === pujaId.toString());
        if (selectedPuja && selectedPuja.price) {
          basePrice = Number(selectedPuja.price);
        }
      }
    }
    
    // Fallback to Puja default price if no pandit specific price found
    if (basePrice === 0) {
      const puja = await Puja.findById(pujaId);
      if (puja && puja.basePrice) {
        basePrice = Number(puja.basePrice);
      }
    }

    // Add Samagri Price
    let samagriPrice = 0;
    if (samagriOption === "Basic") samagriPrice = 500;
    else if (samagriOption === "Premium") samagriPrice = 800;

    const totalAmount = basePrice + samagriPrice;
    const advanceAmount = Math.round(totalAmount * 0.25);
    const remainingAmount = totalAmount - advanceAmount;

    const booking = new Booking({
      user: req.user._id || req.user.id,
      puja: pujaId,
      pandit: panditId || undefined,
      bookingDate: new Date(bookingDate),
      timeSlot,
      samagriOption: samagriOption || "None",
      address: formattedAddress,
      amount: totalAmount,
      originalAmount: totalAmount,
      advanceAmount,
      remainingAmount,
      specialInstructions: specialInstructions || "",
      status: "Pending",
      paymentStatus: "Pending"
    });

    const savedBooking = await booking.save();
    res.status(201).json({ success: true, booking: savedBooking, message: "Booking created successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
  createBooking,
  getUserBookings,
  getAllBookings,
  updateBookingStatus,
};
