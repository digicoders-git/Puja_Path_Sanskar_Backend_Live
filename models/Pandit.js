const mongoose = require("mongoose");

const panditSchema = mongoose.Schema(
  {
    // Step 1 - Basic & Address Details
    fullName: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    alternateNumber: { type: String, default: "" },
    emailId: { type: String, required: true, unique: true },
    dob: { type: String, required: true },
    gender: {
      type: String,
      required: true,
      enum: ["Male", "Female", "Other"],
    },
    gotra: { type: String, default: "" },
    currentAddress: { type: String, required: true },
    permanentAddress: { type: String, required: true },
    latitude: { type: Number },
    longitude: { type: Number },

    // Step 2 - Identity & Media
    aadharNumber: { type: String, required: true },
    panNumber: { type: String, default: "" },
    aadharCardImage: { type: String, default: "" },
    profilePhoto: { type: String, default: "" },
    pujaPhotos: { type: [String], default: [] },
    videoLink: { type: String, default: "" },
    socialLink: { type: String, default: "" },

    // Step 3 - Experience & Pricing
    totalExperience: { type: Number, required: true },
    trainingGurukul: { type: String, required: true },
    specialization: {
      type: String,
      required: true,
      enum: [
        "Vivah Expert",
        "Vastu Specialist",
        "Katha Vachak",
        "Havan Specialist",
        "All-Rounder Pandit",
      ],
    },
    vedaSpecialization: {
      type: String,
      required: true,
      enum: [
        "Rigveda",
        "Yajurveda",
        "Samaveda",
        "Atharvaveda",
        "All Vedas / General",
      ],
    },
    shakha: { type: String, default: "" },
    languagesKnown: { type: String, required: true },
    selectedPujas: [
      {
        puja: { type: mongoose.Schema.Types.ObjectId, ref: "Puja" },
        price: { type: Number, required: true }, // Pandit ka apna price for this Puja
      }
    ],
    pujaKitProvided: {
      type: String,
      default: "Customer provides everything",
      enum: [
        "Customer provides everything",
        "Pandit provides main items",
        "Pandit provides full kit (Extra Charges)",
      ],
    },

    // Step 4 - Quality & Extra Skills
    mantraLevel: {
      type: String,
      default: "Intermediate",
      enum: ["Basic", "Intermediate", "Expert (Sanskrit Scholar)"],
    },
    timeDiscipline: {
      type: String,
      default: "Very Punctual (Strict)",
      enum: ["Flexible", "Punctual", "Very Punctual (Strict)"],
    },
    dressCode: {
      type: String,
      default: "Normal Traditional",
      enum: [
        "Normal Traditional",
        "Full Vedic Attire (Dhoti/Kurta)",
        "Specific as per Puja",
      ],
    },
    eventHandling: {
      type: String,
      default: "Unlimited (Large Gatherings)",
      enum: [
        "Up to 50 People",
        "Up to 200 People",
        "Unlimited (Large Gatherings)",
        "Expert",
      ],
    },
    bhajanKirtan: { type: Boolean, default: false },
    astrology: { type: Boolean, default: false },
    vastu: { type: Boolean, default: false },
    havan: { type: Boolean, default: false },
    corporateExperience: { type: Boolean, default: false },
    onlinePujaSupport: { type: Boolean, default: false },

    // Step 5 - Logistics & Payment
    availableCities: { type: String, required: true },
    travelWillingness: {
      type: String,
      default: "Yes",
      enum: ["Yes", "No"],
    },
    maxDistance: { type: Number, required: true },
    availabilityType: {
      type: String,
      default: "Full-time",
      enum: ["Full-time", "Part-time", "Weekends Only"],
    },
    availableDays: { type: String, default: "" },
    emergencyBooking: { type: Boolean, default: false },
    upiId: { type: String, required: true },
    bankDetails: { type: String, required: true },
    referenceName: { type: String, required: true },
    referenceContact: { type: String, required: true },
    declaration: { type: Boolean, required: true },

    // Status
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Pandit", panditSchema);
