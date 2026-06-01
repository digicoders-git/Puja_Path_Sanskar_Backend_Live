const Puja = require("../models/Puja");

// Create Puja
const createPuja = async (req, res) => {
  try {
    const puja = await Puja.create({
      pujaName: req.body.pujaName,
      pujaType: req.body.pujaType,
      duration: req.body.duration,
      description: req.body.description,
      whatIsIncluded: req.body.whatIsIncluded,
      shortDescription: req.body.shortDescription,
      benefits: req.body.benefits,
      requiredMaterials: req.body.requiredMaterials,
      auspiciousTime: req.body.auspiciousTime,
      basePrice: req.body.basePrice || 0,
      image: req.file ? `https://api.pujapathsanskar.com/uploads/${req.file.filename}` : "",
      isTrending: req.body.isTrending === "true" || req.body.isTrending === true,
    });
    res.status(201).json(puja);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper to format image URL
const formatImageUrl = (image) => {
  if (!image) return "";
  if (image.startsWith("http")) return image;
  return `https://api.pujapathsanskar.com/${image.replace(/\\/g, "/")}`;
};

// Get All Pujas
const getAllPujas = async (req, res) => {
  try {
    const pujas = await Puja.find().sort({ createdAt: -1 });
    const formattedPujas = pujas.map(puja => ({
      ...puja._doc,
      image: formatImageUrl(puja.image)
    }));
    res.json(formattedPujas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Trending Pujas
const getTrendingPujas = async (req, res) => {
  try {
    const pujas = await Puja.find({ isTrending: true, isActive: true }).sort({ createdAt: -1 });
    const formattedPujas = pujas.map(puja => ({
      ...puja._doc,
      image: formatImageUrl(puja.image)
    }));
    res.json(formattedPujas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Single Puja
const getPujaById = async (req, res) => {
  try {
    const puja = await Puja.findById(req.params.id);
    if (!puja) return res.status(404).json({ message: "Puja not found" });
    
    const formattedPuja = {
      ...puja._doc,
      image: formatImageUrl(puja.image)
    };
    res.json(formattedPuja);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Puja
const updatePuja = async (req, res) => {
  try {
    const puja = await Puja.findById(req.params.id);
    if (!puja) return res.status(404).json({ message: "Puja not found" });

    const fields = ["pujaName", "pujaType", "duration", "description", "whatIsIncluded", "basePrice", "shortDescription", "benefits", "requiredMaterials", "auspiciousTime"];
    fields.forEach((f) => { if (req.body[f] !== undefined) puja[f] = req.body[f]; });
    
    if (req.body.isTrending !== undefined) {
      puja.isTrending = req.body.isTrending === "true" || req.body.isTrending === true;
    }
    
    if (req.file) puja.image = `https://api.pujapathsanskar.com/uploads/${req.file.filename}`;

    const updated = await puja.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Puja
const deletePuja = async (req, res) => {
  try {
    const puja = await Puja.findById(req.params.id);
    if (!puja) return res.status(404).json({ message: "Puja not found" });
    await puja.deleteOne();
    res.json({ message: "Puja deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle Active/Inactive
const togglePuja = async (req, res) => {
  try {
    const puja = await Puja.findById(req.params.id);
    if (!puja) return res.status(404).json({ message: "Puja not found" });
    puja.isActive = !puja.isActive;
    await puja.save();
    res.json({ message: `Puja ${puja.isActive ? "activated" : "deactivated"}`, isActive: puja.isActive });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle Trending
const toggleTrendingPuja = async (req, res) => {
  try {
    const puja = await Puja.findById(req.params.id);
    if (!puja) return res.status(404).json({ message: "Puja not found" });
    puja.isTrending = !puja.isTrending;
    await puja.save();
    res.json({ message: `Puja ${puja.isTrending ? "marked as trending" : "removed from trending"}`, isTrending: puja.isTrending });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Enums
const getEnums = (req, res) => {
  res.json({});
};

module.exports = { createPuja, getAllPujas, getTrendingPujas, getPujaById, updatePuja, deletePuja, togglePuja, toggleTrendingPuja, getEnums };
