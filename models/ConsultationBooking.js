const mongoose = require("mongoose");

const consultationBookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    astrologer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Astrologer",
      required: true,
    },
    problemDescription: {
      type: String,
      required: true,
    },
    bookingDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Completed", "Cancelled"],
      default: "Pending",
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },
    amount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ConsultationBooking", consultationBookingSchema);
