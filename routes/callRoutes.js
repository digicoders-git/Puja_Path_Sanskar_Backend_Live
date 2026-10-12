const express = require("express");
const {
  initiateMaskedCall,
  handleInboundWebhook,
  handleStatusCallback,
  getBookingCallHistory,
} = require("../controllers/callController");
const { Auth, userOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// User initiates a secure masked call
router.post("/initiate", Auth, userOnly, initiateMaskedCall);

// Twilio Inbound Webhook (When user or pandit calls Twilio Virtual Number)
router.post("/inbound-webhook", handleInboundWebhook);

// Twilio Status Callback (Twilio updates call completion/duration)
router.post("/status-callback", handleStatusCallback);

// Call history for a booking
router.get("/history/:bookingId", Auth, getBookingCallHistory);

module.exports = router;
