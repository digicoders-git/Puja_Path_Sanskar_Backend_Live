const Astrologer = require("../models/Astrologer");

// Create Astrologer
exports.createAstrologer = async (req, res) => {
  try {
    const astrologer = new Astrologer(req.body);
    await astrologer.save();
    res.status(201).json({ success: true, message: "Astrologer created successfully", astrologer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all Astrologers (Admin)
exports.getAllAstrologers = async (req, res) => {
  try {
    const astrologers = await Astrologer.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, astrologers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Active Astrologers (App)
exports.getActiveAstrologers = async (req, res) => {
  try {
    const astrologers = await Astrologer.find({ status: "online" });
    res.status(200).json({ success: true, astrologers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Astrologer
exports.updateAstrologer = async (req, res) => {
  try {
    const astrologer = await Astrologer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!astrologer) return res.status(404).json({ success: false, message: "Astrologer not found" });
    res.status(200).json({ success: true, message: "Astrologer updated", astrologer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Astrologer
exports.deleteAstrologer = async (req, res) => {
  try {
    const astrologer = await Astrologer.findByIdAndDelete(req.params.id);
    if (!astrologer) return res.status(404).json({ success: false, message: "Astrologer not found" });
    res.status(200).json({ success: true, message: "Astrologer deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
