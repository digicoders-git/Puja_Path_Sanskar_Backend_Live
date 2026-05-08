const Interest = require("../models/Interest");
const Puja = require("../models/Puja");
const User = require("../models/User");

// Create new Interest/Lead (Authenticated)
const createInterest = async (req, res) => {
  try {
    const { pujaId, name, mobile, message } = req.body;

    if (!pujaId || !name || !mobile) {
      return res.status(400).json({ message: "pujaId, name aur mobile required hain", success: false });
    }

    const puja = await Puja.findById(pujaId);
    if (!puja) {
      return res.status(404).json({ message: "Puja not found", success: false });
    }

    const userId = req.user?.id || req.user?._id;

    const interest = new Interest({
      puja: pujaId,
      name,
      mobile,
      message,
      user: userId || undefined,
    });

    await interest.save();
    res.status(201).json({ message: "Interest submitted successfully. We will contact you soon!", success: true, interest });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

// Get all Interests (Admin only)
const getAllInterests = async (req, res) => {
  try {
    const interests = await Interest.find()
      .populate("puja", "pujaType image")
      .populate("user", "name mobile")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: interests.length, interests });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

// Update Interest status and notes (Admin only)
const updateInterest = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const interest = await Interest.findById(req.params.id);

    if (!interest) {
      return res.status(404).json({ message: "Interest record not found", success: false });
    }

    if (status) interest.status = status;
    if (adminNotes !== undefined) interest.adminNotes = adminNotes;

    await interest.save();
    res.status(200).json({ message: "Interest updated successfully", success: true, interest });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

module.exports = {
  createInterest,
  getAllInterests,
  updateInterest,
};
