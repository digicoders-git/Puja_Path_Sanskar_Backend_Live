const express = require("express");
const { createContact, getAllContacts, getContactById, deleteContact } = require("../controllers/contactController");
const { Auth, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", createContact);                    // Public - koi bhi submit kar sakta hai
router.get("/", Auth, adminOnly, getAllContacts);              // Admin only
router.get("/:id", Auth, adminOnly, getContactById);          // Admin only
router.delete("/:id", Auth, adminOnly, deleteContact);        // Admin only

module.exports = router;
