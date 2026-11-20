const mongoose = require("mongoose");

const astrologyCallSessionSchema = new mongoose.Schema(
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
    totalDurationSeconds: {
      type: Number,
      required: true,
      default: 600, // Default 10 minutes
    },
    consumedSeconds: {
      type: Number,
      default: 0,
    },
    remainingSeconds: {
      type: Number,
      default: 600,
    },
    status: {
      type: String,
      enum: ["active", "completed", "expired"],
      default: "active",
    },
    lastCallSid: {
      type: String,
      default: "",
    },
    planTitle: {
      type: String,
      default: "10 Min Consultation",
    },
    amount: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index to quickly query active sessions for a user and astrologer
astrologyCallSessionSchema.index({ user: 1, astrologer: 1, status: 1 });

module.exports = mongoose.model("AstrologyCallSession", astrologyCallSessionSchema);
