const Interest = require("../models/Interest");
const Puja = require("../models/Puja");
const User = require("../models/User");

// Create new Interest/Lead (Authenticated)
const createInterest = async (req, res) => {
  try {
    const { pujaId, message } = req.body;
    const userId = req.user.id || req.user._id;

    // Fetch user details from database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found", success: false });
    }

    const puja = await Puja.findById(pujaId);
    if (!puja) {
      return res.status(404).json({ message: "Puja not found", success: false });
    }

    const interest = new Interest({
      puja: pujaId,
      name: user.name, // Auto-filled from DB
      mobile: user.mobile, // Auto-filled from DB
      message,
      user: userId,
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
      .populate("puja", "pujaName")
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
