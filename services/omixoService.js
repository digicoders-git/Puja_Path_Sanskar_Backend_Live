const axios = require("axios");

/**
 * Clean and format phone number to 12-digit Indian standard (with 91 prefix required by Omixo PRI/SIP trunk)
 */
function cleanIndianNumber(phone) {
  if (!phone) return "";
  const digits = phone.toString().replace(/\D/g, "");
  const last10 = digits.length >= 10 ? digits.slice(-10) : digits;
  return `91${last10}`;
}

/**
 * Mask phone number for display (e.g. 98••••••44)
 */
function maskPhoneNumber(phone) {
  if (!phone) return "सुरक्षित नंबर";
  const str = phone.toString().trim();
  if (str.length <= 4) return "••••";
  const start = str.slice(0, 2);
  const end = str.slice(-2);
  return `${start}••••••${end}`;
}

/**
 * Checks if Omixo API is configured in environment
 */
function isConfigured() {
  const key = process.env.OMIXO_API_KEY;
  return Boolean(
    key &&
    key.trim().length > 0 &&
    key !== "cpaas_your_api_key_here"
  );
}

/**
 * Initiates click-to-call bridge between User and Pandit using Omixo CPaaS API
 * User's phone rings first (agent), and upon pickup, it bridges to Pandit (destination).
 */
async function initiateClickToCall({ userPhone, panditPhone }) {
  const apiKey = process.env.OMIXO_API_KEY;
  const baseUrl = (process.env.OMIXO_BASE_URL || "https://api.omixo.ai/api/v1").replace(/\/$/, "");
  const callerId = process.env.OMIXO_CALLER_ID || "915226523606";

  if (!apiKey) {
    throw new Error("OMIXO_API_KEY .env में कॉन्फ़िगर नहीं है।");
  }

  const agent = cleanIndianNumber(userPhone);
  const destination = cleanIndianNumber(panditPhone);

  if (!agent || agent.length < 10) {
    throw new Error("अमान्य उपयोगकर्ता मोबाइल नंबर (10 अंकों का नंबर होना आवश्यक है)।");
  }
  if (!destination || destination.length < 10) {
    throw new Error("अमान्य पंडित मोबाइल नंबर (10 अंकों का नंबर होना आवश्यक है)।");
  }

  const payload = {
    agent,
    destination,
  };

  if (callerId) {
    payload.caller_id = callerId.toString().replace(/\D/g, "");
  }

  try {
    const response = await axios.post(
      `${baseUrl}/calls/click-to-call`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        timeout: 15000,
      }
    );

    const callSid =
      response.data?.call_id ||
      response.data?.id ||
      response.data?.session_id ||
      `omixo_${Date.now()}`;

    return {
      success: true,
      callSid,
      from: callerId,
      userPhoneMasked: maskPhoneNumber(agent),
      panditPhoneMasked: maskPhoneNumber(destination),
      rawResponse: response.data,
    };
  } catch (error) {
    console.error("Omixo API Error:", error.response?.data || error.message);
    const apiError =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Omixo कॉल सेवा से कनेक्ट नहीं हो सका।";
    throw new Error(apiError);
  }
}

module.exports = {
  isConfigured,
  initiateClickToCall,
  maskPhoneNumber,
  cleanIndianNumber,
};

