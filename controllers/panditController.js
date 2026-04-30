const Pandit = require("../models/Pandit");

// Create Pandit
const createPandit = async (req, res) => {
  try {
    const exists = await Pandit.findOne({ emailId: req.body.emailId });
    if (exists) return res.status(400).json({ message: "Pandit already exists" });

    const pandit = await Pandit.create({
      // Step 1
      fullName: req.body.fullName,
      mobileNumber: req.body.mobileNumber,
      alternateNumber: req.body.alternateNumber || "",
      emailId: req.body.emailId,
      dob: req.body.dob,
      gender: req.body.gender,
      gotra: req.body.gotra || "",
      currentAddress: req.body.currentAddress,
      permanentAddress: req.body.permanentAddress,
      city: req.body.city,
      pincode: req.body.pincode,
      latitude: req.body.latitude ? parseFloat(req.body.latitude) : undefined,
      longitude: req.body.longitude ? parseFloat(req.body.longitude) : undefined,

      // Step 2
      aadharNumber: req.body.aadharNumber,
      panNumber: req.body.panNumber || "",
      aadharCardImage: req.files?.aadharCardImage ? req.files.aadharCardImage[0].path : "",
      profilePhoto: req.files?.profilePhoto ? req.files.profilePhoto[0].path : "",
      pujaPhotos: req.files?.pujaPhotos ? req.files.pujaPhotos.map((f) => f.path) : [],
      videoLink: req.body.videoLink || "",
      socialLink: req.body.socialLink || "",

      // Step 3
      totalExperience: req.body.totalExperience,
      trainingGurukul: req.body.trainingGurukul,
      specialization: req.body.specialization,
      vedaSpecialization: req.body.vedaSpecialization,
      shakha: req.body.shakha || "",
      languagesKnown: req.body.languagesKnown,
      selectedPujas: req.body.selectedPujas
        ? JSON.parse(req.body.selectedPujas)  // Expected: [{ puja: "id", price: 1100 }, ...]
        : [],
      pujaKitProvided: req.body.pujaKitProvided,

      // Step 4
      mantraLevel: req.body.mantraLevel,
      timeDiscipline: req.body.timeDiscipline,
      dressCode: req.body.dressCode,
      eventHandling: req.body.eventHandling,
      bhajanKirtan: req.body.bhajanKirtan === "true" || req.body.bhajanKirtan === true,
      astrology: req.body.astrology === "true" || req.body.astrology === true,
      vastu: req.body.vastu === "true" || req.body.vastu === true,
      havan: req.body.havan === "true" || req.body.havan === true,
      corporateExperience: req.body.corporateExperience === "true" || req.body.corporateExperience === true,
      onlinePujaSupport: req.body.onlinePujaSupport === "true" || req.body.onlinePujaSupport === true,

      // Step 5
      availableCities: req.body.availableCities,
      travelWillingness: req.body.travelWillingness,
      maxDistance: req.body.maxDistance,
      availabilityType: req.body.availabilityType,
      availableDays: req.body.availableDays || "",
      emergencyBooking: req.body.emergencyBooking === "true" || req.body.emergencyBooking === true,
      upiId: req.body.upiId,
      bankDetails: req.body.bankDetails,
      referenceName: req.body.referenceName,
      referenceContact: req.body.referenceContact,
      declaration: req.body.declaration === "true" || req.body.declaration === true,
    });

    res.status(201).json(pandit);
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: "Validation Error", errors: messages });
    }
    res.status(500).json({ message: error.message });
  }
};

// Get All Pandits
const getAllPandits = async (req, res) => {
  try {
    const pandits = await Pandit.find().populate("selectedPujas.puja", "pujaName pujaType duration").sort({ createdAt: -1 });
    res.json(pandits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search/Filter Pandits (PUBLIC)
const searchPandits = async (req, res) => {
  try {
    const { city, specialization, minExperience, maxExperience } = req.query;

    // Filter object banao
    const filter = { isActive: true }; // Sirf active pandits

    // City filter
    if (city) {
      filter.city = { $regex: city, $options: "i" }; // Case insensitive
    }

    // Specialization filter
    if (specialization) {
      filter.specialization = specialization;
    }

    // Experience filter
    if (minExperience || maxExperience) {
      filter.totalExperience = {};
      if (minExperience) filter.totalExperience.$gte = Number(minExperience);
      if (maxExperience) filter.totalExperience.$lte = Number(maxExperience);
    }

    const pandits = await Pandit.find(filter)
      .select("fullName mobileNumber emailId city specialization totalExperience profilePhoto selectedPujas")
      .populate("selectedPujas.puja", "pujaName pujaType")
      .sort({ totalExperience: -1 });

    res.json({
      count: pandits.length,
      pandits,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Single Pandit
const getPanditById = async (req, res) => {
  try {
    const pandit = await Pandit.findById(req.params.id).populate("selectedPujas.puja", "pujaName pujaType duration");
    if (!pandit) return res.status(404).json({ message: "Pandit not found" });
    res.json(pandit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Pandit
const updatePandit = async (req, res) => {
  try {
    const pandit = await Pandit.findById(req.params.id);
    if (!pandit) return res.status(404).json({ message: "Pandit not found" });

    const fields = [
      "fullName", "mobileNumber", "alternateNumber", "emailId", "dob", "gender", "gotra",
      "currentAddress", "permanentAddress", "city", "pincode", "latitude", "longitude",
      "aadharNumber", "panNumber", "videoLink", "socialLink",
      "totalExperience", "trainingGurukul", "specialization", "vedaSpecialization",
      "shakha", "languagesKnown", "pujaKitProvided",
      "mantraLevel", "timeDiscipline", "dressCode", "eventHandling",
      "availableCities", "travelWillingness", "maxDistance", "availabilityType", "availableDays",
      "upiId", "bankDetails", "referenceName", "referenceContact",
    ];

    fields.forEach((f) => {
      if (req.body[f] !== undefined) pandit[f] = req.body[f];
    });

    if (req.body.selectedPujas !== undefined) {
      pandit.selectedPujas = JSON.parse(req.body.selectedPujas);
    }

    // Boolean fields
    const boolFields = ["bhajanKirtan", "astrology", "vastu", "havan", "corporateExperience", "onlinePujaSupport", "emergencyBooking", "declaration"];
    boolFields.forEach((f) => {
      if (req.body[f] !== undefined) pandit[f] = req.body[f] === "true" || req.body[f] === true;
    });

    if (req.files?.profilePhoto) pandit.profilePhoto = req.files.profilePhoto[0].path;
    if (req.files?.aadharCardImage) pandit.aadharCardImage = req.files.aadharCardImage[0].path;
    if (req.files?.pujaPhotos) pandit.pujaPhotos = req.files.pujaPhotos.map((f) => f.path);

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

// Toggle Active/Inactive
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

// Get All Enum Values (Frontend ke liye)
const getEnums = (req, res) => {
  res.json({
    gender: ["Male", "Female", "Other"],
    specialization: ["Vivah Expert", "Vastu Specialist", "Katha Vachak", "Havan Specialist", "All-Rounder Pandit"],
    vedaSpecialization: ["Rigveda", "Yajurveda", "Samaveda", "Atharvaveda", "All Vedas / General"],
    travelCharges: ["Included in Puja", "Extra as per distance", "Negotiable"],
    pujaKitProvided: ["Customer provides everything", "Pandit provides main items", "Pandit provides full kit (Extra Charges)"],
    mantraLevel: ["Basic", "Intermediate", "Expert (Sanskrit Scholar)"],
    timeDiscipline: ["Flexible", "Punctual", "Very Punctual (Strict)"],
    dressCode: ["Normal Traditional", "Full Vedic Attire (Dhoti/Kurta)", "Specific as per Puja"],
    eventHandling: ["Up to 50 People", "Up to 200 People", "Unlimited (Large Gatherings)", "Expert"],
    travelWillingness: ["Yes", "No"],
    availabilityType: ["Full-time", "Part-time", "Weekends Only"],
  });
};

// Get Pandits by Puja ID (Kitne Pandits ek Puja karte hain)
const getPanditsByPuja = async (req, res) => {
  try {
    const { pujaId } = req.params;

    const pandits = await Pandit.find({
      "selectedPujas.puja": pujaId,
      isActive: true,
    })
      .select("fullName city specialization totalExperience profilePhoto mobileNumber selectedPujas")
      .sort({ totalExperience: -1 });

    // Filter selectedPujas array to only show the requested puja
    const filteredPandits = pandits.map((p) => {
      const pObj = p.toObject();
      pObj.selectedPujas = pObj.selectedPujas.filter(
        (sp) => sp.puja.toString() === pujaId
      );
      return pObj;
    });

    res.json({
      pujaId,
      totalPandits: filteredPandits.length,
      pandits: filteredPandits,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createPandit, getAllPandits, searchPandits, getPanditsByPuja, getPanditById, updatePandit, deletePandit, togglePandit, getEnums };
