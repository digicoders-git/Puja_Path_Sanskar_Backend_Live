const Astrologer = require("../models/Astrologer");
const fs = require("fs");
const path = require("path");

// Helper to convert base64 image to file and return URL
const processBase64Image = (base64String) => {
  if (base64String && base64String.startsWith('data:image')) {
    try {
      const matches = base64String.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const type = matches[1] === 'jpeg' ? 'jpg' : matches[1];
        const data = Buffer.from(matches[2], 'base64');
        const filename = `${Date.now()}-astrologer.${type}`;
        const filepath = path.join(__dirname, '../uploads', filename);
        
        // Ensure uploads dir exists
        if (!fs.existsSync(path.join(__dirname, '../uploads'))) {
          fs.mkdirSync(path.join(__dirname, '../uploads'), { recursive: true });
        }
        
        fs.writeFileSync(filepath, data);
        return `http://localhost:5000/uploads/${filename}`;
      }
    } catch (e) {
      console.log("Error processing base64 image:", e);
    }
  }
  return base64String;
};

// Create Astrologer
exports.createAstrologer = async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.image) {
      data.image = processBase64Image(data.image);
    }
    const astrologer = new Astrologer(data);
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
    const data = { ...req.body };
    if (data.image) {
      data.image = processBase64Image(data.image);
    }
    const astrologer = await Astrologer.findByIdAndUpdate(req.params.id, data, { new: true });
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
