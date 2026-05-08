const mongoose = require("mongoose");

const contactSchema = mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Contact", contactSchema);
