const express = require("express");
const {
  createInterest,
  getAllInterests,
  updateInterest,
} = require("../controllers/interestController");
const { Auth, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", Auth, createInterest);

// Admin Routes
router.get("/admin/all", Auth, adminOnly, getAllInterests);
router.patch("/admin/:id", Auth, adminOnly, updateInterest);

module.exports = router;
