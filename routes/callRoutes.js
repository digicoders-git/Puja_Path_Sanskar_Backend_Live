const express = require("express");
const {
  initiateMaskedCall,
  getBridgeTwiML,
  handleInboundWebhook,
  handleStatusCallback,
  getBookingCallHistory,
} = require("../controllers/callController");
const { Auth, userOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// User initiates a secure masked call
router.post("/initiate", Auth, userOnly, initiateMaskedCall);

// Public Bridge TwiML Endpoint (Twilio Cloud fetches this to bridge user and pandit)
router.get("/bridge-twiml/:bookingId", getBridgeTwiML);
router.post("/bridge-twiml/:bookingId", getBridgeTwiML);

// Twilio Inbound Webhook (When user or pandit calls Twilio Virtual Number directly)
router.post("/inbound-webhook", handleInboundWebhook);

// Twilio Status Callback (Twilio updates call completion/duration)
router.post("/status-callback", handleStatusCallback);

// Call history for a booking
router.get("/history/:bookingId", Auth, getBookingCallHistory);

module.exports = router;
