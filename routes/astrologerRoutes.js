const express = require("express");
const router = express.Router();
const astrologerController = require("../controllers/astrologerController");
const { Auth, adminOnly, userOnly } = require("../middleware/authMiddleware");

// Admin routes
router.post("/", astrologerController.createAstrologer);
router.get("/admin/all", astrologerController.getAllAstrologers);
router.put("/:id", astrologerController.updateAstrologer);
router.delete("/:id", astrologerController.deleteAstrologer);

// App routes
router.get("/active", astrologerController.getActiveAstrologers);

module.exports = router;
