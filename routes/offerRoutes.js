const express = require("express");
const {
  createOffer,
  getAllOffers,
  getAllOffersAdmin,
  getOffersByPuja,
  updateOffer,
  toggleOffer,
  deleteOffer,
} = require("../controllers/offerController");
const { Auth, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// Public Routes
router.get("/", getAllOffers);                          // Saare active offers
router.get("/puja/:pujaId", getOffersByPuja);          // Kisi puja ke offers

// Admin Routes
router.post("/", Auth, adminOnly, createOffer);                    // Offer banao
router.get("/admin/all", Auth, adminOnly, getAllOffersAdmin);       // Admin - saare offers
router.patch("/:id", Auth, adminOnly, updateOffer);                // Offer update
router.patch("/:id/toggle", Auth, adminOnly, toggleOffer);         // Active/Inactive
router.delete("/:id", Auth, adminOnly, deleteOffer);               // Delete

module.exports = router;
