const mongoose = require("mongoose");

const pujaSchema = mongoose.Schema(
  {
    pujaType: { type: String, required: true },
    duration: { type: String, required: true },
    description: { type: String, required: true },
    whatIsIncluded: { type: String, required: true },
    image: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Puja", pujaSchema);
