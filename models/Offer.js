const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    discountType: {
      type: String,
      required: true,
      enum: ["percentage"],
    },
    discountValue: { type: Number, required: true },
    applicableTo: {
      type: String,
      required: true,
      enum: ["all", "specific"],
      default: "all",
    },
    pujas: [{ type: mongoose.Schema.Types.ObjectId, ref: "Puja" }], // specific ke liye
    minAmount: { type: Number, default: 0 },
    priority: { type: Number, default: 0 }, // Jitna zyada number, utni zyada priority
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Offer", offerSchema);
