require("dotenv").config();
const twilioService = require("../services/twilioService");

console.log("=== Testing Phone Formatting ===");
console.log("9696559848 =>", twilioService.formatToE164("9696559848")); // should be +919696559848
console.log("+919696559848 =>", twilioService.formatToE164("+919696559848"));
console.log("09696559848 =>", twilioService.formatToE164("09696559848"));
console.log("919696559848 =>", twilioService.formatToE164("919696559848"));

console.log("\n=== Testing Phone Masking ===");
console.log("+919696559848 =>", twilioService.maskPhoneNumber("+919696559848"));
console.log("9876543210 =>", twilioService.maskPhoneNumber("9876543210"));

console.log("\n=== Testing Inbound TwiML Generation ===");
const twiml = twilioService.generateInboundBridgeTwiML({
  targetPhone: "9696559848",
  isUserCalling: true,
  partyName: "सुरेश शास्त्री",
});
console.log(twiml);

console.log("\n=== Twilio Config Status ===");
console.log("isConfigured:", twilioService.isConfigured());
