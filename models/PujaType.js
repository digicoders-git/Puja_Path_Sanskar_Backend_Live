const mongoose = require("mongoose");

const pujaTypeSchema = mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PujaType", pujaTypeSchema);
