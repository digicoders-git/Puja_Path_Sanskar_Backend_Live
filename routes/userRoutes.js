const express = require("express");
const { sendOtp, verifyOtp, getAllUsers } = require("../controllers/userController");
const { Auth, adminOnly } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

// Admin route to get all users
router.get("/", Auth, adminOnly, getAllUsers);
router.put("/:id", Auth, adminOnly, require("../controllers/userController").updateUser);
router.delete("/:id", Auth, adminOnly, require("../controllers/userController").deleteUser);
router.patch("/:id/toggle", Auth, adminOnly, require("../controllers/userController").toggleUserStatus);

module.exports = router;
