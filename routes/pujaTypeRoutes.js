const express = require("express");
const { getAllPujaTypes, createPujaType, deletePujaType } = require("../controllers/pujaTypeController");
const { Auth, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getAllPujaTypes);
router.post("/", Auth, adminOnly, createPujaType);
router.delete("/:id", Auth, adminOnly, deletePujaType);

module.exports = router;
