const express = require("express");
const multer = require("multer");
const {
  createPandit,
  getAllPandits,
  searchPandits,
  getPanditsByPuja,
  getPanditById,
  updatePandit,
  deletePandit,
  togglePandit,
  getEnums,
} = require("../controllers/panditController");
const { Auth, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

// File type filter
const fileFilter = (req, file, cb) => {
  if (file.fieldname === "profilePhoto" || file.fieldname === "pujaPhotos") {
    // Sirf images allowed
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`${file.fieldname}: Only JPG, PNG, WEBP images allowed`), false);
    }
  } else if (file.fieldname === "aadharCardImage") {
    // Images + PDF allowed
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Aadhar: Only JPG, PNG, WEBP, PDF allowed"), false);
    }
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// Multiple files: profilePhoto (1), aadharCardImage (1), pujaPhotos (upto 5)
const uploadFields = upload.fields([
  { name: "profilePhoto", maxCount: 1 },
  { name: "aadharCardImage", maxCount: 1 },
  { name: "pujaPhotos", maxCount: 5 },
]);

// Multer error handler
const handleUpload = (req, res, next) => {
  uploadFields(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
};

router.get("/enums", getEnums);
router.get("/search", searchPandits);
router.get("/by-puja/:pujaId", getPanditsByPuja);  // Public - Puja ke pandits
router.post("/", handleUpload, createPandit);
router.get("/", getAllPandits);
router.get("/:id", Auth, adminOnly, getPanditById);
router.put("/:id", Auth, adminOnly, handleUpload, updatePandit);
router.delete("/:id", Auth, adminOnly, deletePandit);
router.patch("/:id/toggle", Auth, adminOnly, togglePandit);

module.exports = router;
