const Pandit = require("../models/Pandit");

// OTP Verification (Fixed to 1234)
const sendOTP = async (req, res) => {
  const { mobileNumber } = req.body;
  if (!mobileNumber) return res.status(400).json({ message: "Mobile number is required" });
  res.json({ message: `OTP sent to ${mobileNumber}`, fixedOTP: "1234" });
};

const verifyOTP = async (req, res) => {
  const { mobileNumber, otp } = req.body;
  if (!mobileNumber || !otp) return res.status(400).json({ message: "Mobile and OTP are required" });
  if (otp === "1234") {
    res.json({ success: true, message: "OTP verified successfully" });
  } else {
    res.status(400).json({ success: false, message: "Invalid OTP" });
  }
};

// Create Pandit
const createPandit = async (req, res) => {
  try {
    const exists = await Pandit.findOne({ mobileNumber: req.body.mobileNumber });
    if (exists) return res.status(400).json({ message: "Pandit with this mobile number already exists" });

    const parseJson = (val) => {
      if (!val) return [];
      try { return typeof val === 'string' ? JSON.parse(val) : val; } 
      catch (e) { return []; }
    };

    const panditData = {
      // 1. Basic Details
      fullName: req.body.fullName,
      mobileNumber: req.body.mobileNumber,
      whatsappNumber: req.body.whatsappNumber || "",
      alternateNumber: req.body.alternateNumber || "",
      emailId: (req.body.emailId && req.body.emailId !== "" && req.body.emailId !== "null") ? req.body.emailId.toLowerCase().trim() : undefined,
      dob: req.body.dob || "",
      gender: req.body.gender || "",

      // 2. Address Details
      state: req.body.state,
      city: req.body.city,
      district: req.body.district,
      currentAddress: req.body.currentAddress || "",
      permanentAddress: req.body.permanentAddress || "",
      pincode: req.body.pincode || "",

      // 3. Identity Verification
      aadharNumber: req.body.aadharNumber || "",
      panCard: req.body.panCard || "",

      // 4. Files handled below
      
      // 5. Experience & Qualification
      experience: req.body.experience,
      trainingGurukul: req.body.trainingGurukul || "",
      specializations: parseJson(req.body.specializations),
      languages: parseJson(req.body.languages),

      // 6. Puja Services & Pricing
      basicPujaCharges: req.body.basicPujaCharges || "",
      akhandPathCharges: req.body.akhandPathCharges || "",
      perDayCharges: req.body.perDayCharges || "",
      travelCharges: req.body.travelCharges || "",

      // 7. Quality & Skill Assessment
      mantraLevel: req.body.mantraLevel || "",
      timeDiscipline: req.body.timeDiscipline || "",
      dressCode: req.body.dressCode || "",
      eventHandling: req.body.eventHandling || "",
      traditionalDress: req.body.traditionalDress || "",
      audioClarity: req.body.audioClarity || "",

      // 8. Extra Skills
      bhajanKirtan: req.body.bhajanKirtan === "true" || req.body.bhajanKirtan === true,
      astrology: req.body.astrology === "true" || req.body.astrology === true,
      vastu: req.body.vastu === "true" || req.body.vastu === true,
      havan: req.body.havan === "true" || req.body.havan === true,
      corporateExperience: req.body.corporateExperience === "true" || req.body.corporateExperience === true,
      liveEventExperience: parseJson(req.body.liveEventExperience),

      // 9. Availability & Travel
      availableCities: parseJson(req.body.availableCities),
      travelWillingness: req.body.travelWillingness || "",
      maxDistance: req.body.maxDistance || "",
      serviceArea: req.body.serviceArea || "",
      travelAvailability: req.body.travelAvailability || "",

      // 10. Availability Schedule
      availabilityType: req.body.availabilityType || "",
      availableDays: parseJson(req.body.availableDays),
      emergencyBooking: req.body.emergencyBooking || "",

      // 11. Payment Details
      bankUpiDetails: req.body.bankUpiDetails || "",
      bankDetails: req.body.bankDetails || "",
      samagriArrangement: req.body.samagriArrangement || "",
      samagriExperience: req.body.samagriExperience || "",

      // 12. Management
      mediaPermission: req.body.mediaPermission || "",
      declaration: req.body.declaration === "true" || req.body.declaration === true,

      // Files
      idProof: req.files?.idProof ? `https://api.pujapathsanskar.com/uploads/${req.files.idProof[0].filename}` : "",
      profilePhoto: req.files?.profilePhoto ? `https://api.pujapathsanskar.com/uploads/${req.files.profilePhoto[0].filename}` : "",
      introVideo: req.files?.introVideo ? `https://api.pujapathsanskar.com/uploads/${req.files.introVideo[0].filename}` : "",
      pujaPhotos: req.files?.pujaPhotos ? req.files.pujaPhotos.map(f => `https://api.pujapathsanskar.com/uploads/${f.filename}`) : [],
      pujaVideoClips: req.files?.pujaVideoClips ? req.files.pujaVideoClips.map(f => `https://api.pujapathsanskar.com/uploads/${f.filename}`) : [],
      selectedPujas: parseJson(req.body.selectedPujas),
    };

    const pandit = await Pandit.create(panditData);
    res.status(201).json(pandit);
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: "Validation Error", errors: messages });
    }
    res.status(500).json({ message: error.message });
  }
};

// Helper to format image/video URL
const formatMediaUrl = (media) => {
  if (!media) return "";
  if (media.startsWith("http")) return media;
  return `https://api.pujapathsanskar.com/${media.replace(/\\/g, "/")}`;
};

const formatPanditMedia = (pandit) => {
  const p = pandit._doc ? pandit._doc : pandit;
  return {
    ...p,
    idProof: formatMediaUrl(p.idProof),
    profilePhoto: formatMediaUrl(p.profilePhoto),
    introVideo: formatMediaUrl(p.introVideo),
    pujaPhotos: p.pujaPhotos ? p.pujaPhotos.map(formatMediaUrl) : [],
    pujaVideoClips: p.pujaVideoClips ? p.pujaVideoClips.map(formatMediaUrl) : [],
  };
};

// Get All Pandits (Admin only)
const getAllPandits = async (req, res) => {
  try {
    const pandits = await Pandit.find().sort({ createdAt: -1 });
    res.json(pandits.map(formatPanditMedia));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Active Pandits
const getActivePandits = async (req, res) => {
  try {
    const pandits = await Pandit.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(pandits.map(formatPanditMedia));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search Pandits
const searchPandits = async (req, res) => {
  try {
    const { city, specialization } = req.query;
    let query = { isActive: true };
    if (city) query.city = new RegExp(city, "i");
    if (specialization) query.specializations = { $in: [new RegExp(specialization, "i")] };
    const pandits = await Pandit.find(query).sort({ createdAt: -1 });
    res.json(pandits.map(formatPanditMedia));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Single Pandit
const getPanditById = async (req, res) => {
  try {
    const pandit = await Pandit.findById(req.params.id);
    if (!pandit) return res.status(404).json({ message: "Pandit not found" });
    res.json(formatPanditMedia(pandit));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Pandit
const updatePandit = async (req, res) => {
  try {
    const pandit = await Pandit.findById(req.params.id);
    if (!pandit) return res.status(404).json({ message: "Pandit not found" });

    const parseJson = (val) => {
      if (!val) return [];
      try { return typeof val === 'string' ? JSON.parse(val) : val; } 
      catch (e) { return []; }
    };

    const textFields = [
      "fullName", "mobileNumber", "whatsappNumber", "alternateNumber", "emailId", "dob", "gender",
      "state", "city", "district", "currentAddress", "permanentAddress", "pincode",
      "aadharNumber", "panCard", "experience", "trainingGurukul",
      "basicPujaCharges", "akhandPathCharges", "perDayCharges", "travelCharges",
      "mantraLevel", "timeDiscipline", "dressCode", "eventHandling", "traditionalDress", "audioClarity",
      "travelWillingness", "maxDistance", "serviceArea", "travelAvailability",
      "availabilityType", "emergencyBooking", "bankUpiDetails", "bankDetails", "samagriArrangement", "samagriExperience",
      "mediaPermission"
    ];

    textFields.forEach(f => {
      if (req.body[f] !== undefined) {
        if (f === "emailId") {
          if (!req.body[f] || req.body[f] === "" || req.body[f] === "null") {
            pandit[f] = undefined;
          } else {
            pandit[f] = req.body[f].toLowerCase().trim();
          }
        } else {
          pandit[f] = req.body[f];
        }
      }
    });

    const jsonFields = ["specializations", "languages", "liveEventExperience", "availableCities", "availableDays", "selectedPujas"];
    jsonFields.forEach(f => {
      if (req.body[f] !== undefined) pandit[f] = parseJson(req.body[f]);
    });

    const boolFields = ["bhajanKirtan", "astrology", "vastu", "havan", "corporateExperience", "declaration"];
    boolFields.forEach(f => {
      if (req.body[f] !== undefined) {
        pandit[f] = req.body[f] === "true" || req.body[f] === true;
      }
    });

    if (req.files?.idProof) pandit.idProof = `https://api.pujapathsanskar.com/uploads/${req.files.idProof[0].filename}`;
    if (req.files?.profilePhoto) pandit.profilePhoto = `https://api.pujapathsanskar.com/uploads/${req.files.profilePhoto[0].filename}`;
    if (req.files?.introVideo) pandit.introVideo = `https://api.pujapathsanskar.com/uploads/${req.files.introVideo[0].filename}`;
    if (req.files?.pujaPhotos) pandit.pujaPhotos = req.files.pujaPhotos.map(f => `https://api.pujapathsanskar.com/uploads/${f.filename}`);
    if (req.files?.pujaVideoClips) pandit.pujaVideoClips = req.files.pujaVideoClips.map(f => `https://api.pujapathsanskar.com/uploads/${f.filename}`);

    const updated = await pandit.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Pandit
const deletePandit = async (req, res) => {
  try {
    const pandit = await Pandit.findById(req.params.id);
    if (!pandit) return res.status(404).json({ message: "Pandit not found" });
    await pandit.deleteOne();
    res.json({ message: "Pandit deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle Active
const togglePandit = async (req, res) => {
  try {
    const pandit = await Pandit.findById(req.params.id);
    if (!pandit) return res.status(404).json({ message: "Pandit not found" });
    pandit.isActive = !pandit.isActive;
    await pandit.save();
    res.json({ message: `Pandit ${pandit.isActive ? "activated" : "deactivated"}`, isActive: pandit.isActive });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add Review to Pandit
const addPanditReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || !comment) {
      return res.status(400).json({ message: "Rating and comment are required" });
    }

    const pandit = await Pandit.findById(req.params.id);
    if (!pandit) return res.status(404).json({ message: "Pandit not found" });

    const review = {
      user: req.user.id || req.user._id,
      rating: Number(rating),
      comment,
      image: req.file ? `https://api.pujapathsanskar.com/uploads/${req.file.filename}` : "",
    };

    if (!pandit.reviews) pandit.reviews = [];
    pandit.reviews.push(review);

    const totalReviews = pandit.reviews.length;
    const avg = pandit.reviews.reduce((acc, item) => item.rating + acc, 0) / totalReviews;
    pandit.averageRating = parseFloat(avg.toFixed(1));
    pandit.totalReviews = totalReviews;

    const updatedPandit = await pandit.save();
    
    // Repopulate user info for returning if needed, but returning success is enough
    res.status(201).json({ message: "Review added successfully", pandit: formatPanditMedia(updatedPandit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
  createPandit,
  getAllPandits,
  getPanditById,
  updatePandit,
  deletePandit,
  togglePandit,
  getActivePandits,
  searchPandits,
  addPanditReview,
};
