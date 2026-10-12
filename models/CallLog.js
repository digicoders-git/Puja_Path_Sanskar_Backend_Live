const mongoose = require("mongoose");

const callLogSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    pandit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pandit",
      required: true,
    },
    callSid: {
      type: String,
      default: "",
    },
    fromVirtualNumber: {
      type: String,
      default: "",
    },
    userPhoneMasked: {
      type: String,
      default: "",
    },
    panditPhoneMasked: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["initiated", "ringing", "in-progress", "completed", "failed", "busy", "no-answer", "canceled"],
      default: "initiated",
    },
    duration: {
      type: Number,
      default: 0, // In seconds
    },
    direction: {
      type: String,
      enum: ["outbound-bridge", "inbound-bridge"],
      default: "outbound-bridge",
    },
    initiatedBy: {
      type: String,
      enum: ["user", "pandit"],
      default: "user",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CallLog", callLogSchema);
