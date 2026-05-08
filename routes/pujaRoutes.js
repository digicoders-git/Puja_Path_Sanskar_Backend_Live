const express = require("express");
const multer = require("multer");
const {
  createPuja, getAllPujas, getPujaById,
  updatePuja, deletePuja, togglePuja, getEnums,
} = require("../controllers/pujaController");
const { Auth } = require("../middleware/authMiddleware");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error("Only JPG, PNG, WEBP allowed"), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

router.get("/enums", getEnums);
router.post("/", Auth, upload.single("image"), createPuja);
router.get("/", getAllPujas);                                  // Public
router.get("/:id", getPujaById);                              // Public
router.put("/:id", Auth, upload.single("image"), updatePuja);
router.delete("/:id", Auth, deletePuja);
router.patch("/:id/toggle", Auth, togglePuja);

module.exports = router;
