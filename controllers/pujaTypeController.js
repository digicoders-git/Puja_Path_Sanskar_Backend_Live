const PujaType = require("../models/PujaType");

const getAllPujaTypes = async (req, res) => {
  try {
    const types = await PujaType.find().sort({ name: 1 });
    res.json(types);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createPujaType = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });
    
    const existing = await PujaType.findOne({ name });
    if (existing) return res.status(400).json({ message: "Type already exists" });

    const newType = await PujaType.create({ name });
    res.status(201).json(newType);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deletePujaType = async (req, res) => {
  try {
    const { id } = req.params;
    await PujaType.findByIdAndDelete(id);
    res.json({ message: "Puja Type deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAllPujaTypes, createPujaType, deletePujaType };
