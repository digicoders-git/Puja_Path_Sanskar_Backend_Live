const Razorpay = require("razorpay");
const crypto = require("crypto");
const Booking = require("../models/Booking");
const Puja = require("../models/Puja");
const Admin = require("../models/Admin");
const Offer = require("../models/Offer");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Step 1: Sirf Razorpay order banao, booking DB mein SAVE NAHI hogi abhi
const createBookingWithPayment = async (req, res) => {
  try {
    const { pujaId, panditId, bookingDate, timeSlot, address, amount, specialInstructions, offerId } = req.body;

    if (!pujaId || !panditId || !bookingDate || !timeSlot || !address || !amount) {
      return res.status(400).json({ message: "pujaId, panditId, bookingDate, timeSlot, address, amount required hain", success: false });
    }

    const puja = await Puja.findById(pujaId);
    if (!puja) return res.status(404).json({ message: "Puja not found", success: false });

    // Offer apply karo agar offerId diya hai
    let finalAmount = Number(amount);
    let discountAmount = 0;
    let appliedOffer = null;

    if (offerId) {
      const now = new Date();
      const offer = await Offer.findOne({ _id: offerId, isActive: true, startDate: { $lte: now }, endDate: { $gte: now } });

      if (offer) {
        // Check applicable
        const isApplicable = offer.applicableTo === "all" || offer.pujas.map((p) => p.toString()).includes(pujaId);
        if (isApplicable && finalAmount >= offer.minAmount) {
          discountAmount = offer.discountType === "percentage"
            ? Math.round((finalAmount * offer.discountValue) / 100)
            : offer.discountValue;
          discountAmount = Math.min(discountAmount, finalAmount);
          finalAmount = finalAmount - discountAmount;
          appliedOffer = { _id: offer._id, title: offer.title, discountAmount };
        }
      }
    }

    const advanceAmount = Math.round(finalAmount * 0.25);
    const remainingAmount = finalAmount - advanceAmount;

    // Razorpay order banao, booking details notes mein rakho
    const razorpayOrder = await razorpay.orders.create({
      amount: advanceAmount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        pujaId,
        panditId,
        bookingDate,
        timeSlot,
        address,
        originalAmount: Number(amount),
        offerId: appliedOffer ? String(appliedOffer._id) : "",
        discountAmount,
        amount: finalAmount,
        advanceAmount,
        remainingAmount,
        specialInstructions: specialInstructions || "",
        userId: String(req.user.id || req.user._id),
      },
    });

    // ❌ Booking DB mein SAVE NAHI hogi jab tak payment verify na ho
    res.status(200).json({
      success: true,
      message: "Razorpay order ready. 25% advance payment karo. Booking tabhi banegi jab payment verify hogi.",
      payment: {
        razorpayOrderId: razorpayOrder.id,
        originalAmount: Number(amount),
        discountAmount,
        youSaved: discountAmount,
        finalAmount,
        advanceAmount,
        remainingAmount,
        currency: "INR",
        key: process.env.RAZORPAY_KEY_ID,
      },
      appliedOffer,
    });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

// Step 2: Payment verify hone ke BAAD booking DB mein save hogi
const verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ message: "razorpayOrderId, razorpayPaymentId, razorpaySignature required hain", success: false });
    }

    // Signature verify karo
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({ message: "Payment verification failed! Invalid signature.", success: false });
    }

    // Razorpay se order fetch karo taaki notes mein se booking details nikale
    const order = await razorpay.orders.fetch(razorpayOrderId);
    const notes = order.notes;

    // ✅ Payment verify hone ke BAAD ab booking save karo
    const booking = new Booking({
      user: notes.userId,
      puja: notes.pujaId,
      pandit: notes.panditId,
      bookingDate: notes.bookingDate,
      timeSlot: notes.timeSlot,
      address: notes.address,
      originalAmount: Number(notes.originalAmount),
      offer: notes.offerId || null,
      discountAmount: Number(notes.discountAmount) || 0,
      amount: Number(notes.amount),
      advanceAmount: Number(notes.advanceAmount),
      remainingAmount: Number(notes.remainingAmount),
      specialInstructions: notes.specialInstructions,
      razorpayOrderId: razorpayOrderId,
      razorpayPaymentId: razorpayPaymentId,
      status: "Confirmed",
      paymentStatus: "AdvancePaid",
    });

    await booking.save();

    // ✅ 25% advance amount Admin wallet mein add karo
    const admin = await Admin.findOne();
    if (admin) {
      admin.walletBalance = (admin.walletBalance || 0) + booking.advanceAmount;
      await admin.save();
    }

    res.status(201).json({
      success: true,
      message: `25% advance payment successful! Booking confirmed. Baaki ₹${booking.remainingAmount} puja ke din dena.`,
      booking,
    });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

// Step 3: Remaining 75% payment (Puja ke din)
const payRemainingAmount = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found", success: false });

    if (booking.paymentStatus !== "AdvancePaid") {
      return res.status(400).json({ message: "Pehle advance payment karo", success: false });
    }

    // Razorpay order banao remaining amount ke liye
    const razorpayOrder = await razorpay.orders.create({
      amount: booking.remainingAmount * 100,
      currency: "INR",
      receipt: `remaining_${Date.now()}`,
    });

    res.status(200).json({
      success: true,
      message: "Remaining 75% payment karo",
      payment: {
        razorpayOrderId: razorpayOrder.id,
        remainingAmount: booking.remainingAmount,
        currency: "INR",
        key: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

// Step 4: Remaining payment verify karo
const verifyRemainingPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, bookingId } = req.body;

    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({ message: "Payment verification failed!", success: false });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found", success: false });

    booking.paymentStatus = "FullyPaid";
    booking.status = "Completed";
    await booking.save();

    // ✅ 75% remaining amount Admin wallet mein add karo
    const admin = await Admin.findOne();
    if (admin) {
      admin.walletBalance = (admin.walletBalance || 0) + booking.remainingAmount;
      await admin.save();
    }

    res.status(200).json({
      success: true,
      message: "Full payment complete! Booking completed.",
      booking,
    });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

module.exports = {
  createBookingWithPayment,
  verifyPayment,
  payRemainingAmount,
  verifyRemainingPayment,
};
