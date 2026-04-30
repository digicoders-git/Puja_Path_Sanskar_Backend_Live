const mongoose = require("mongoose");

const interestSchema = new mongoose.Schema(
  {
    puja: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Puja",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // Optional, if user is logged in
    },
    name: {
      type: String,
      required: true,
    },
    mobile: {
      type: String,
      required: true,
    },
    message: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Pending", "Contacted", "Converted", "Dropped"],
      default: "Pending",
    },
    adminNotes: {
      type: String, // Admin can leave notes after calling
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Interest", interestSchema);
