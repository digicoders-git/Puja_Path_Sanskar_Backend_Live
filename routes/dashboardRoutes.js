const express = require("express");
const { getDashboard } = require("../controllers/dashboardController");
const { Auth, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", Auth ,adminOnly, getDashboard);

module.exports = router;
