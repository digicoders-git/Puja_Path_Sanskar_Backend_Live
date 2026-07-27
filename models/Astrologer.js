const mongoose = require("mongoose");

const astrologerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    specialty: {
      type: String,
      required: true,
    },
    experience: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      default: 5.0,
    },
    reviews: {
      type: String, // String like "2.1k", "500", etc.
      default: "0",
    },
    emoji: {
      type: String,
      default: "🧙‍♂️",
    },
    languages: {
      type: String,
      required: true,
    },
    badge: {
      type: String, // e.g. "टॉप रेटेड" (Top Rated)
      default: "",
    },
    badgeColor: {
      type: String, // Hex color code e.g. "0xFFE65100" or "#E65100"
      default: "#E65100",
    },
    status: {
      type: String,
      enum: ["online", "offline"],
      default: "online",
    },
    fees: {
      type: Number,
      default: 0,
    },
    image: {
      type: String, // Custom image URL if emoji is not used
    },
    description: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Astrologer", astrologerSchema);
