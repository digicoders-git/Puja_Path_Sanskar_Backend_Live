const express = require("express");
const multer = require("multer");
const path = require("path");
const {
  registerAdmin,
  loginAdmin,
  getAdminProfile,
  changePassword,
  updateAdminProfile,
  sendPushNotification,
  triggerDailyRashiNotifications,
} = require("../controllers/adminController");
const { Auth, adminOnly } = require("../middleware/authMiddleware");
const router = express.Router();

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

router.post("/register", upload.single("image"), registerAdmin);
router.post("/login", loginAdmin);
router.get("/profile", Auth, adminOnly, getAdminProfile);
router.put("/profile", Auth, adminOnly, upload.single("image"), updateAdminProfile);
router.put("/change-password", Auth, adminOnly, changePassword);
router.post("/send-notification", Auth, adminOnly, upload.single("image"), sendPushNotification);
router.post("/trigger-rashi-notifications", Auth, adminOnly, triggerDailyRashiNotifications);

module.exports = router;
