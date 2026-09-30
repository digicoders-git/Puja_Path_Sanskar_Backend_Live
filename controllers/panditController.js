const Pandit = require("../models/Pandit");
const emailService = require("../services/emailService");

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
      latitude: req.body.latitude ? Number(req.body.latitude) : 0,
      longitude: req.body.longitude ? Number(req.body.longitude) : 0,
      mapAddress: req.body.mapAddress || "",

      // 3. Identity Verification
      aadharNumber: req.body.aadharNumber || "",
      panCard: req.body.panCard || "",

      // 4. Files handled below

      // 5. Experience & Qualification
      experience: req.body.experience,
      totalExperience: req.body.totalExperience || "",
      trainingGurukul: req.body.trainingGurukul || "",
      primarySpecialization: req.body.primarySpecialization || req.body.specialization || "",
      vedaSpecialization: req.body.vedaSpecialization || "",
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
      idProof: req.files?.idProof ? `${getBaseUrl(req)}/uploads/${req.files.idProof[0].filename}` : "",
      profilePhoto: req.files?.profilePhoto ? `${getBaseUrl(req)}/uploads/${req.files.profilePhoto[0].filename}` : "",
      introVideo: req.files?.introVideo ? `${getBaseUrl(req)}/uploads/${req.files.introVideo[0].filename}` : "",
      pujaPhotos: req.files?.pujaPhotos ? req.files.pujaPhotos.map(f => `${getBaseUrl(req)}/uploads/${f.filename}`) : [],
      pujaVideoClips: req.files?.pujaVideoClips ? req.files.pujaVideoClips.map(f => `${getBaseUrl(req)}/uploads/${f.filename}`) : [],
      selectedPujas: parseJson(req.body.selectedPujas),
    };

    const pandit = await Pandit.create(panditData);
    
    // Send Email Notification Asynchronously
    emailService.sendPanditRegistrationEmail(pandit).catch(console.error);

    res.status(201).json(pandit);
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: "Validation Error", errors: messages });
    }
    res.status(500).json({ message: error.message });
  }
};

const { getBaseUrl, formatMediaUrl } = require("../utils/urlHelper");

const formatPanditMedia = (pandit, req) => {
  const p = pandit._doc ? pandit._doc : pandit;
  return {
    ...p,
    idProof: formatMediaUrl(p.idProof, req),
    profilePhoto: formatMediaUrl(p.profilePhoto, req),
    introVideo: formatMediaUrl(p.introVideo, req),
    pujaPhotos: p.pujaPhotos ? p.pujaPhotos.map(m => formatMediaUrl(m, req)) : [],
    pujaVideoClips: p.pujaVideoClips ? p.pujaVideoClips.map(m => formatMediaUrl(m, req)) : [],
  };
};

// Get All Pandits (Admin only)
const getAllPandits = async (req, res) => {
  try {
    let query = {};
    if (req.query.pujaId) {
      const mongoose = require('mongoose');
      const pId = mongoose.isValidObjectId(req.query.pujaId) ? new mongoose.Types.ObjectId(req.query.pujaId) : req.query.pujaId;
      query.selectedPujas = { $elemMatch: { puja: pId } };
    }

    const pandits = await Pandit.find(query)
      .populate("selectedPujas.puja")
      .populate("reviews.user", "name profileImage")
      .sort({ createdAt: -1 });
    res.json(pandits.map(p => formatPanditMedia(p, req)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Active Pandits
const getActivePandits = async (req, res) => {
  try {
    let query = { isActive: true };
    if (req.query.pujaId) {
      const mongoose = require('mongoose');
      const pId = mongoose.isValidObjectId(req.query.pujaId) ? new mongoose.Types.ObjectId(req.query.pujaId) : req.query.pujaId;
      query.selectedPujas = { $elemMatch: { puja: pId } };
    }

    const pandits = await Pandit.find(query)
      .populate("selectedPujas.puja")
      .populate("reviews.user", "name profileImage")
      .sort({ createdAt: -1 });
    res.json(pandits.map(p => formatPanditMedia(p, req)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search Pandits
const searchPandits = async (req, res) => {
  try {
    const { city, specialization, pujaId } = req.query;
    let query = { isActive: true };
    if (city) query.city = new RegExp(city, "i");
    if (specialization) query.specializations = { $in: [new RegExp(specialization, "i")] };
    if (pujaId) {
      const mongoose = require('mongoose');
      const pId = mongoose.isValidObjectId(pujaId) ? new mongoose.Types.ObjectId(pujaId) : pujaId;
      query.selectedPujas = { $elemMatch: { puja: pId } };
    }

    const pandits = await Pandit.find(query)
      .populate("selectedPujas.puja")
      .populate("reviews.user", "name profileImage")
      .sort({ createdAt: -1 });
    res.json(pandits.map(p => formatPanditMedia(p, req)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// City coordinates mapping for fallback when pandit has no exact lat/lng
const CITY_COORDINATES = {
  'delhi': { lat: 28.6139, lng: 77.2090 },
  'noida': { lat: 28.5355, lng: 77.3910 },
  'gurgaon': { lat: 28.4595, lng: 77.0266 },
  'ghaziabad': { lat: 28.6692, lng: 77.4538 },
  'faridabad': { lat: 28.4089, lng: 77.3178 },
  'mumbai': { lat: 19.0760, lng: 72.8777 },
  'pune': { lat: 18.5204, lng: 73.8567 },
  'bengaluru': { lat: 12.9716, lng: 77.5946 },
  'chennai': { lat: 13.0827, lng: 80.2707 },
  'hyderabad': { lat: 17.3850, lng: 78.4867 },
  'kolkata': { lat: 22.5726, lng: 88.3639 },
  'ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'jaipur': { lat: 26.9124, lng: 75.7873 },
  'lucknow': { lat: 26.8467, lng: 80.9462 },
  'varanasi': { lat: 25.3176, lng: 82.9739 },
  'prayagraj': { lat: 25.4358, lng: 81.8463 },
  'mathura': { lat: 27.4924, lng: 77.6737 },
  'vrindavan': { lat: 27.5794, lng: 77.6964 },
  'ayodhya': { lat: 26.7922, lng: 82.1998 },
  'haridwar': { lat: 29.9457, lng: 78.1642 },
  'rishikesh': { lat: 30.0869, lng: 78.2676 },
  'indore': { lat: 22.7196, lng: 75.8577 },
  'bhopal': { lat: 23.2599, lng: 77.4126 },
  'patna': { lat: 25.5941, lng: 85.1376 },
  'kanpur': { lat: 26.4499, lng: 80.3319 },
  'gorakhpur': { lat: 26.7606, lng: 83.3732 },
  'agra': { lat: 27.1767, lng: 78.0081 },
  'meerut': { lat: 28.9845, lng: 77.7064 },
  'bareilly': { lat: 28.3670, lng: 79.4304 },
  'aligarh': { lat: 27.8974, lng: 78.0880 },
  'moradabad': { lat: 28.8386, lng: 78.7733 },
  'mirzapur': { lat: 25.1337, lng: 82.5644 },
  'sitapur': { lat: 27.5684, lng: 80.6829 },
  'jhansi': { lat: 25.4484, lng: 78.5685 },
  'gonda': { lat: 27.1300, lng: 81.9600 },
  'barabanki': { lat: 26.9274, lng: 81.1843 },
  'hardoi': { lat: 27.3956, lng: 80.1314 },
  'raebareli': { lat: 26.2298, lng: 81.2415 },
  'sultanpur': { lat: 26.2648, lng: 82.0727 },
  'amethi': { lat: 26.1558, lng: 81.8159 },
  'unnao': { lat: 26.5463, lng: 80.4879 },
};

// Haversine distance in KM
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Get Nearby Pandits based on GPS coordinates or city
const getNearbyPandits = async (req, res) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat) : null;
    const lng = req.query.lng ? parseFloat(req.query.lng) : null;
    const city = req.query.city ? req.query.city.trim() : null;
    const maxRadius = req.query.radius ? parseFloat(req.query.radius) : 100; // default 100km

    let query = { isActive: true };
    const pandits = await Pandit.find(query)
      .populate("selectedPujas.puja")
      .populate("reviews.user", "name profileImage");

    const formatted = pandits.map(p => {
      const data = formatPanditMedia(p, req);
      let pLat = data.latitude;
      let pLng = data.longitude;

      // Fallback to city coordinates if pandit doesn't have exact lat/lng
      if ((!pLat || pLat === 0) && data.city) {
        const cityKey = data.city.toLowerCase().trim();
        if (CITY_COORDINATES[cityKey]) {
          pLat = CITY_COORDINATES[cityKey].lat;
          pLng = CITY_COORDINATES[cityKey].lng;
        }
      }

      data.latitude = pLat || 0;
      data.longitude = pLng || 0;

      // Calculate distance if user lat/lng provided
      if (lat !== null && lng !== null && pLat && pLng) {
        const dist = calculateDistanceKm(lat, lng, pLat, pLng);
        data.distanceKm = parseFloat(dist.toFixed(1));
      } else {
        data.distanceKm = null;
      }

      return data;
    });

    // If coordinates were provided, sort by distance
    let result = formatted;
    if (lat !== null && lng !== null) {
      result = formatted
        .filter(p => p.distanceKm === null || p.distanceKm <= maxRadius)
        .sort((a, b) => {
          if (a.distanceKm === null) return 1;
          if (b.distanceKm === null) return -1;
          return a.distanceKm - b.distanceKm;
        });
    } else if (city) {
      // Filter by city if no coordinates provided
      const cLower = city.toLowerCase();
      result = formatted.filter(p => (p.city || "").toLowerCase().includes(cLower));
    }

    res.json({ success: true, count: result.length, pandits: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Single Pandit
const getPanditById = async (req, res) => {
  try {
    const pandit = await Pandit.findById(req.params.id)
      .populate("selectedPujas.puja")
      .populate("reviews.user", "name profileImage");
    if (!pandit) return res.status(404).json({ message: "Pandit not found" });
    res.json(formatPanditMedia(pandit, req));
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
      "latitude", "longitude", "mapAddress",
      "aadharNumber", "panCard", "experience", "trainingGurukul", "totalExperience",
      "primarySpecialization", "specialization", "vedaSpecialization",
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

    const baseUrl = getBaseUrl(req);
    if (req.files?.idProof) pandit.idProof = `${baseUrl}/uploads/${req.files.idProof[0].filename}`;
    if (req.files?.profilePhoto) pandit.profilePhoto = `${baseUrl}/uploads/${req.files.profilePhoto[0].filename}`;
    if (req.files?.introVideo) pandit.introVideo = `${baseUrl}/uploads/${req.files.introVideo[0].filename}`;
    if (req.files?.pujaPhotos) pandit.pujaPhotos = req.files.pujaPhotos.map(f => `${baseUrl}/uploads/${f.filename}`);
    if (req.files?.pujaVideoClips) pandit.pujaVideoClips = req.files.pujaVideoClips.map(f => `${baseUrl}/uploads/${f.filename}`);

    const updated = await pandit.save();
    res.json(formatPanditMedia(updated, req));
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
      image: req.file ? `${getBaseUrl(req)}/uploads/${req.file.filename}` : "",
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

// Get Pandit Form Enums
const getEnums = (req, res) => {
  res.json({
    specialization: [
      "Grih Pravesh",
      "Vivah",
      "Satyanarayan Katha",
      "Rudrabhishek",
      "Sunderkand",
      "Jagran",
      "Bhagwat Katha",
      "Navgrah Shanti",
      "Havan / Yagya",
      "Vastu Shanti",
      "Maha Mrityunjaya Jaap",
      "Kaal Sarp Dosh Nivaran"
    ],
    vedaSpecialization: [
      "Rigveda",
      "Yajurveda (Shukla)",
      "Yajurveda (Krishna)",
      "Samaveda",
      "Atharvaveda",
      "Sarva Veda / Karmakand"
    ],
    mantraLevel: [
      "Basic",
      "Intermediate",
      "Fluent / Advanced",
      "Vedic Acharya Level"
    ],
    timeDiscipline: [
      "Strictly on Time (Always)",
      "15 Mins Buffer",
      "Flexible"
    ],
    experience: ["1–3 Years", "3–7 Years", "7+ Years"],
    serviceArea: ["Within 10 km", "Entire City", "Nearby Districts"],
    samagriArrangement: ["Yes", "No"],
    samagriExperience: ["Basic Setup", "Full Setup", "No"],
    travelAvailability: ["Only Local Area", "Entire District", "Other States Also"]
  });
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
  getNearbyPandits,
  addPanditReview,
  getEnums,
};
