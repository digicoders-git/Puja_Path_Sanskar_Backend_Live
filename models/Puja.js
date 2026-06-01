const mongoose = require("mongoose");

const pujaSchema = mongoose.Schema(
  {
    pujaName: { type: String, required: true },
    pujaType: { type: String, required: true },
    duration: { type: String, required: true },
    description: { type: String, required: true },
    whatIsIncluded: { type: String, required: true },
    shortDescription: { type: String, default: "" },
    benefits: { type: String, default: "" },
    requiredMaterials: { type: String, default: "" },
    auspiciousTime: { type: String, default: "" },
    basePrice: { type: String, default: "0" },
    image: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    isTrending: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Puja", pujaSchema);
