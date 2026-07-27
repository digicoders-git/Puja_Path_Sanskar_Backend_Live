const express = require("express");
const multer = require("multer");
const { sendOtp, verifyOtp, getMyProfile, updateMyProfile, getAllUsers } = require("../controllers/userController");
const { Auth, adminOnly, userOnly } = require("../middleware/authMiddleware");
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/google", require("../controllers/userController").googleLogin);

// User Profile Routes (requires user token)
router.get("/profile", Auth, userOnly, getMyProfile);
router.put("/profile", Auth, userOnly, upload.single("profileImage"), updateMyProfile);

// Admin Routes (requires admin token)
router.get("/", Auth, adminOnly, getAllUsers);
router.put("/:id", Auth, adminOnly, require("../controllers/userController").updateUser);
router.delete("/:id", Auth, adminOnly, require("../controllers/userController").deleteUser);
router.patch("/:id/toggle", Auth, adminOnly, require("../controllers/userController").toggleUserStatus);

module.exports = router;
