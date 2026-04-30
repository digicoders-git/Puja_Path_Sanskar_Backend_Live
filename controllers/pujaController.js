const Puja = require("../models/Puja");

// Create Puja
const createPuja = async (req, res) => {
  try {
    const puja = await Puja.create({
      pujaType: req.body.pujaType,
      duration: req.body.duration,
      description: req.body.description,
      whatIsIncluded: req.body.whatIsIncluded,
      image: req.file ? req.file.path : "",
    });
    res.status(201).json(puja);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Pujas
const getAllPujas = async (req, res) => {
  try {
    const pujas = await Puja.find().sort({ createdAt: -1 });
    res.json(pujas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Single Puja
const getPujaById = async (req, res) => {
  try {
    const puja = await Puja.findById(req.params.id);
    if (!puja) return res.status(404).json({ message: "Puja not found" });
    res.json(puja);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Puja
const updatePuja = async (req, res) => {
  try {
    const puja = await Puja.findById(req.params.id);
    if (!puja) return res.status(404).json({ message: "Puja not found" });

    const fields = ["pujaType", "duration", "description", "whatIsIncluded"];
    fields.forEach((f) => { if (req.body[f] !== undefined) puja[f] = req.body[f]; });
    if (req.file) puja.image = req.file.path;

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

// Get Enums
const getEnums = (req, res) => {
  res.json({});
};

module.exports = { createPuja, getAllPujas, getPujaById, updatePuja, deletePuja, togglePuja, getEnums };
