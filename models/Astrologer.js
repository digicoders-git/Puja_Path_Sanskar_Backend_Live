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
    },
    bio: {
      type: String,
    },
    location: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    consultationModes: {
      type: [String],
      default: ["Chat", "Voice Call", "Video Call"]
    },
    services: [
      {
        name: String,
        icon: String
      }
    ],
    plans: [
      {
        title: String,
        duration: Number,
        price: Number,
        description: String,
        features: [String],
        isPopular: { type: Boolean, default: false },
        isBest: { type: Boolean, default: false },
        color: { type: String, default: "0xFFE65100" } // App requires color
      }
    ],
    availability: {
      days: {
        type: [String],
        default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
      },
      startTime: { type: String, default: "09:00 AM" },
      endTime: { type: String, default: "09:00 PM" }
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Astrologer", astrologerSchema);
