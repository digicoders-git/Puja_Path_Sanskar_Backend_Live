const express = require("express");
const {
  addAddress,
  getUserAddresses,
  updateAddress,
  deleteAddress,
} = require("../controllers/addressController");
const { Auth } = require("../middleware/authMiddleware");

const router = express.Router();

// All routes require authentication
router.use(Auth);

router.route("/")
  .post(addAddress)
  .get(getUserAddresses);

router.route("/:id")
  .put(updateAddress)
  .delete(deleteAddress);

module.exports = router;
