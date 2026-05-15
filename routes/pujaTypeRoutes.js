const express = require("express");
const { getAllPujaTypes, createPujaType, deletePujaType } = require("../controllers/pujaTypeController");
const { Auth } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getAllPujaTypes);
router.post("/", Auth, createPujaType);
router.delete("/:id", Auth, deletePujaType);

module.exports = router;
