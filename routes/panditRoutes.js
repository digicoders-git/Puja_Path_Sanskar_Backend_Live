const express = require("express");
const multer = require("multer");
const {
  // sendOTP,   // OTP disabled
  // verifyOTP, // OTP disabled
  createPandit,
  getAllPandits,
  getPanditById,
  updatePandit,
  deletePandit,
  togglePandit,
  getActivePandits,
  searchPandits,
  addPanditReview,
} = require("../controllers/panditController");
const { Auth, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max (for videos)
});

// Updated fields for Step 1 & Step 2
const uploadFields = upload.fields([
  { name: "idProof", maxCount: 1 },
  { name: "profilePhoto", maxCount: 1 },
  { name: "introVideo", maxCount: 1 },
  { name: "pujaPhotos", maxCount: 10 },
  { name: "pujaVideoClips", maxCount: 10 },
]);

const handleUpload = (req, res, next) => {
  uploadFields(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
};

// OTP Routes — DISABLED
// router.post("/send-otp", sendOTP);
// router.post("/verify-otp", verifyOTP);

// Pandit Routes
router.post("/", handleUpload, createPandit);
router.post("/:id/reviews", Auth, upload.single("image"), addPanditReview);
router.get("/active", getActivePandits); // Public route
router.get("/search", searchPandits); // Public search route
router.get("/", Auth, adminOnly, getAllPandits);
router.get("/:id", Auth, adminOnly, getPanditById);
router.put("/:id", Auth, adminOnly, handleUpload, updatePandit);
router.delete("/:id", Auth, adminOnly, deletePandit);
router.patch("/:id/toggle", Auth, adminOnly, togglePandit);

module.exports = router;
