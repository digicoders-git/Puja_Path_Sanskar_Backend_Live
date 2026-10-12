const twilio = require("twilio");

// Clean and convert phone numbers to E.164 international standard
function formatToE164(phone) {
  if (!phone) return null;
  const raw = phone.toString().trim();
  const digitsOnly = raw.replace(/\D/g, "");

  if (raw.startsWith("+")) {
    return `+${digitsOnly}`;
  }

  // 10 digit Indian number
  if (digitsOnly.length === 10) {
    return `+91${digitsOnly}`;
  }

  // 11 digits starting with 0 (e.g. 09696559848)
  if (digitsOnly.length === 11 && digitsOnly.startsWith("0")) {
    return `+91${digitsOnly.substring(1)}`;
  }

  // 12 digits starting with 91 (e.g. 919696559848)
  if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    return `+${digitsOnly}`;
  }

  return `+${digitsOnly}`;
}

// Mask phone number for display (e.g., +91 96••••••48)
function maskPhoneNumber(phone) {
  if (!phone) return "सुरक्षित नंबर";
  const str = phone.toString().trim();
  if (str.length <= 4) return "••••";
  const start = str.slice(0, 2);
  const end = str.slice(-2);
  return `${start}••••••${end}`;
}

function isConfigured() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const phone = process.env.TWILIO_PHONE_NUMBER;
  return Boolean(
    sid &&
    token &&
    phone &&
    sid !== "your_twilio_account_sid_here" &&
    token !== "your_twilio_auth_token_here"
  );
}

function getClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;

  if (!sid || !token) {
    throw new Error("Twilio credentials (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN) are missing in .env");
  }

  return twilio(sid, token);
}

/**
 * Initiates an outbound bridged call:
 * 1. Twilio calls the User from Twilio Virtual Number (User sees only Twilio Number).
 * 2. User answers -> Twilio speaks welcome announcement.
 * 3. Twilio dials Pandit from Twilio Virtual Number (Pandit sees only Twilio Number).
 * 4. User and Pandit speak securely with 100% number masking!
 */
async function initiateMaskedCall({
  userPhone,
  panditPhone,
  userName = "भक्त जन",
  panditName = "पंडित जी",
  statusCallbackUrl,
}) {
  const client = getClient();
  const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

  const formattedUser = formatToE164(userPhone);
  const formattedPandit = formatToE164(panditPhone);

  if (!formattedUser || !formattedPandit) {
    throw new Error("Invalid phone number format for user or pandit");
  }

  // Build TwiML for connecting the two legs
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();

  // Professional Hindu/Sanskrit greeting in Hindi
  response.say(
    { language: "hi-IN", voice: "Polly.Aditi" },
    `नमस्कार ${userName}। पूजा पाठ संस्कार में आपका स्वागत है। आपकी कॉल पंडित ${panditName} से सुरक्षित रूप से जोड़ी जा रही है, कृपया लाइन पर बने रहें।`
  );

  // Dial Pandit with Twilio Virtual Number as callerId
  const dial = response.dial({
    callerId: twilioNumber, // Pandit sees Twilio number, NOT user's number!
    timeout: 35,
    record: "do-not-record",
  });
  dial.number(formattedPandit);

  // Create outbound call to User (User sees Twilio number, NOT pandit's number!)
  const callPayload = {
    to: formattedUser,
    from: twilioNumber,
    twiml: response.toString(),
  };

  if (statusCallbackUrl) {
    callPayload.statusCallback = statusCallbackUrl;
    callPayload.statusCallbackEvent = ["initiated", "ringing", "answered", "completed"];
    callPayload.statusCallbackMethod = "POST";
  }

  const call = await client.calls.create(callPayload);
  return {
    callSid: call.sid,
    status: call.status,
    from: twilioNumber,
    userPhoneMasked: maskPhoneNumber(formattedUser),
    panditPhoneMasked: maskPhoneNumber(formattedPandit),
  };
}

/**
 * Generates TwiML for incoming calls to the Twilio Virtual Number
 */
function generateInboundBridgeTwiML({ targetPhone, isUserCalling, partyName }) {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();
  const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!targetPhone) {
    response.say(
      { language: "hi-IN", voice: "Polly.Aditi" },
      "पूजा पाठ संस्कार में आपका स्वागत है। आपकी कोई सक्रिय बुकिंग नहीं पाई गई। कृपया ऐप से संपर्क करें।"
    );
    return response.toString();
  }

  const greeting = isUserCalling
    ? `नमस्कार। आपकी कॉल पंडित ${partyName || "जी"} से जोड़ी जा रही है।`
    : `नमस्कार पंडित जी। आपकी कॉल यजमान ${partyName || ""} से जोड़ी जा रही है।`;

  response.say({ language: "hi-IN", voice: "Polly.Aditi" }, greeting);

  const dial = response.dial({
    callerId: twilioNumber,
    timeout: 35,
  });
  dial.number(formatToE164(targetPhone));

  return response.toString();
}

module.exports = {
  formatToE164,
  maskPhoneNumber,
  isConfigured,
  initiateMaskedCall,
  generateInboundBridgeTwiML,
};
