const mongoose = require("mongoose");

const panditSchema = mongoose.Schema(
  {
    // --- STEP 1: 14 IMPORTANT POINTS (MANDATORY EXCEPT UPI) ---
    fullName: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    whatsappNumber: { type: String, default: "" },
    state: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    experience: { type: String, required: true }, // 1–3 Years, 3–7 Years, 7+ Years
    specializations: { type: [String], required: true },
    languages: { type: [String], required: true },
    idProof: { type: String, required: true }, // Aadhaar/PAN upload
    profilePhoto: { type: String, required: true }, // Traditional dress photo
    serviceArea: { type: String, required: true }, // Within 10 km, Entire City, Nearby Districts
    samagriArrangement: { type: String, required: true }, // Yes, No
    bankUpiDetails: { type: String, default: "" }, // UPI ID (OPTIONAL)
    samagriExperience: { type: String, required: true }, // Basic Setup, Full Setup, No
    travelAvailability: { type: String, required: true }, // Only Local Area, Entire District, Other States Also
    liveEventExperience: { type: [String], required: true }, // Jagran, Bhagwat Katha, etc.
    selectedPujas: [
      {
        puja: { type: mongoose.Schema.Types.ObjectId, ref: "Puja" },
        price: { type: Number, default: 0 }
      }
    ],

    // --- OTHER OPTIONAL FIELDS (STEP 2+) ---
    alternateNumber: { type: String, default: "" },
    emailId: { type: String, unique: true, sparse: true },
    dob: { type: String, default: "" },
    gender: { type: String, default: "" },
    currentAddress: { type: String, default: "" },
    permanentAddress: { type: String, default: "" },
    pincode: { type: String, default: "" },
    aadharNumber: { type: String, default: "" },
    panCard: { type: String, default: "" },
    trainingGurukul: { type: String, default: "" },
    basicPujaCharges: { type: String, default: "" },
    akhandPathCharges: { type: String, default: "" },
    perDayCharges: { type: String, default: "" },
    travelCharges: { type: String, default: "" },
    mantraLevel: { type: String, default: "" },
    timeDiscipline: { type: String, default: "" },
    dressCode: { type: String, default: "" },
    eventHandling: { type: String, default: "" },
    traditionalDress: { type: String, default: "" }, 
    audioClarity: { type: String, default: "" },
    bhajanKirtan: { type: Boolean, default: false },
    astrology: { type: Boolean, default: false },
    vastu: { type: Boolean, default: false },
    havan: { type: Boolean, default: false },
    corporateExperience: { type: Boolean, default: false },
    availableCities: { type: [String], default: [] },
    travelWillingness: { type: String, default: "" },
    maxDistance: { type: String, default: "" },
    availabilityType: { type: String, default: "" }, // Full-time / Part-time
    availableDays: { type: [String], default: [] },
    emergencyBooking: { type: String, default: "" },
    bankDetails: { type: String, default: "" },
    introVideo: { type: String, default: "" },
    pujaPhotos: { type: [String], default: [] },
    pujaVideoClips: { type: [String], default: [] },
    mediaPermission: { type: String, default: "" },
    declaration: { type: Boolean, default: false },
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Pandit", panditSchema);
