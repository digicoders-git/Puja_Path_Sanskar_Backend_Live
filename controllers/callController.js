const Booking = require("../models/Booking");
const User = require("../models/User");
const Pandit = require("../models/Pandit");
const CallLog = require("../models/CallLog");
const twilioService = require("../services/twilioService");

// 1. Initiate Masked Call (User App -> Backend -> Twilio Bridge)
const initiateMaskedCall = async (req, res) => {
  try {
    const { bookingId, userPhoneOverride } = req.body;
    const userId = req.user.id || req.user._id;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID आवश्यक है।",
      });
    }

    // Check Twilio Configuration
    if (!twilioService.isConfigured()) {
      return res.status(503).json({
        success: false,
        isConfigured: false,
        message: "Twilio Call Masking सेवा सक्रिय नहीं है। कृपया .env में TWILIO_AUTH_TOKEN कॉन्फ़िगर करें।",
      });
    }

    const booking = await Booking.findById(bookingId)
      .populate("pandit", "fullName mobileNumber")
      .populate("user", "name mobile");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "बुकिंग नहीं मिली।",
      });
    }

    // Security check: Must belong to user (or admin)
    if (booking.user._id.toString() !== userId.toString() && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "आपको इस बुकिंग के लिए कॉल करने की अनुमति नहीं है।",
      });
    }

    if (!booking.pandit) {
      return res.status(400).json({
        success: false,
        message: "इस बुकिंग के लिए अभी कोई पंडित जी आवंटित नहीं किए गए हैं।",
      });
    }

    const userPhone = userPhoneOverride || booking.user.mobile;
    const panditPhone = booking.pandit.mobileNumber;

    if (!userPhone) {
      return res.status(400).json({
        success: false,
        message: "आपका मोबाइल नंबर प्रोफाइल में उपलब्ध नहीं है। कृपया पहले प्रोफाइल अपडेट करें।",
      });
    }

    if (!panditPhone) {
      return res.status(400).json({
        success: false,
        message: "पंडित जी का संपर्क नंबर उपलब्ध नहीं है।",
      });
    }

    // Public Base URL so Twilio's cloud servers can fetch the TwiML instructions
    const baseUrl =
      process.env.BASE_URL && !process.env.BASE_URL.includes("localhost")
        ? process.env.BASE_URL
        : "https://api.pujapathsanskar.com";

    const twimlUrl = `${baseUrl}/api/calls/bridge-twiml/${booking._id}`;

    let statusCallbackUrl = undefined;
    if (baseUrl && !baseUrl.includes("localhost")) {
      statusCallbackUrl = `${baseUrl}/api/calls/status-callback`;
    }

    // Call Twilio Service to bridge User and Pandit via URL
    const result = await twilioService.initiateMaskedCall({
      userPhone,
      panditPhone,
      userName: booking.user.name || "भक्त जन",
      panditName: booking.pandit.fullName || "पंडित जी",
      twimlUrl,
      statusCallbackUrl,
    });

    // Save call log for audit and masking verification
    await CallLog.create({
      booking: booking._id,
      user: booking.user._id,
      pandit: booking.pandit._id,
      callSid: result.callSid,
      fromVirtualNumber: result.from,
      userPhoneMasked: result.userPhoneMasked,
      panditPhoneMasked: result.panditPhoneMasked,
      status: "initiated",
      direction: "outbound-bridge",
      initiatedBy: "user",
    });

    return res.status(200).json({
      success: true,
      message: "सुरक्षित कॉल शुरू हो गई है! आपके फ़ोन पर इनकमिंग कॉल आ रही है, कृपया कॉल उठाएं।",
      callSid: result.callSid,
      virtualNumber: result.from,
      panditPhoneMasked: result.panditPhoneMasked,
    });
  } catch (error) {
    console.error("Masked Call Error:", error);

    // Provide friendly advice if trial account verification issue occurs
    let userMsg = error.message || "कॉल कनेक्ट करने में त्रुटि हुई।";
    if (error.code === 21215 || error.message?.includes("unverified")) {
      userMsg = "Twilio Trial खाता होने के कारण दोनों नंबर (यूज़र और पंडित) Twilio Console में Verified होने चाहिए।";
    }

    return res.status(500).json({
      success: false,
      message: userMsg,
    });
  }
};

// 2. Public Bridge TwiML Endpoint (Twilio Cloud fetches this when user answers)
const getBridgeTwiML = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId)
      .populate("pandit", "fullName mobileNumber")
      .populate("user", "name mobile");

    if (!booking || !booking.pandit || !booking.pandit.mobileNumber) {
      res.type("text/xml");
      return res.send(
        `<?xml version="1.0" encoding="UTF-8"?><Response><Say language="hi-IN">पंडित जी का नंबर उपलब्ध नहीं है। कृपया ऐप से सहायता लें।</Say></Response>`
      );
    }

    const xml = twilioService.generateBridgeTwiML({
      userName: (booking.user && booking.user.name) || "भक्त जन",
      panditName: (booking.pandit && booking.pandit.fullName) || "पंडित जी",
      panditPhone: booking.pandit.mobileNumber,
    });

    res.type("text/xml");
    return res.send(xml);
  } catch (error) {
    console.error("Bridge TwiML Error:", error);
    res.type("text/xml");
    return res.send(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Say language="hi-IN">कॉल कनेक्ट करने में तकनीकी त्रुटि हुई।</Say></Response>`
    );
  }
};

// 3. Twilio Inbound Webhook (When user or pandit dials Twilio Virtual Number directly)
const handleInboundWebhook = async (req, res) => {
  try {
    const callerRaw = req.body.From || "";
    const cleanDigits = callerRaw.replace(/\D/g, "").slice(-10);

    let targetPhone = null;
    let isUserCalling = true;
    let partyName = "";

    // 1. Check if caller is a User
    const user = await User.findOne({ mobile: { $regex: cleanDigits } });
    if (user) {
      const activeBooking = await Booking.findOne({
        user: user._id,
        status: { $in: ["Confirmed", "Pending"] },
      })
        .sort({ updatedAt: -1 })
        .populate("pandit", "fullName mobileNumber");

      if (activeBooking && activeBooking.pandit && activeBooking.pandit.mobileNumber) {
        targetPhone = activeBooking.pandit.mobileNumber;
        partyName = activeBooking.pandit.fullName;
        isUserCalling = true;
      }
    } else {
      // 2. Check if caller is a Pandit
      const pandit = await Pandit.findOne({ mobileNumber: { $regex: cleanDigits } });
      if (pandit) {
        const activeBooking = await Booking.findOne({
          pandit: pandit._id,
          status: { $in: ["Confirmed", "Pending"] },
        })
          .sort({ updatedAt: -1 })
          .populate("user", "name mobile");

        if (activeBooking && activeBooking.user && activeBooking.user.mobile) {
          targetPhone = activeBooking.user.mobile;
          partyName = activeBooking.user.name;
          isUserCalling = false;
        }
      }
    }

    const twiml = twilioService.generateInboundBridgeTwiML({
      targetPhone,
      isUserCalling,
      partyName,
    });

    res.type("text/xml");
    return res.send(twiml);
  } catch (error) {
    console.error("Inbound Webhook Error:", error);
    const twiml = twilioService.generateInboundBridgeTwiML({ targetPhone: null });
    res.type("text/xml");
    return res.send(twiml);
  }
};

// 4. Status Callback (Twilio Webhook for Call Completion & Duration)
const handleStatusCallback = async (req, res) => {
  try {
    const { CallSid, CallStatus, CallDuration } = req.body;
    if (CallSid) {
      await CallLog.findOneAndUpdate(
        { callSid: CallSid },
        {
          status: CallStatus ? CallStatus.toLowerCase() : "completed",
          duration: CallDuration ? parseInt(CallDuration, 10) : 0,
        }
      );
    }
    return res.status(200).send("OK");
  } catch (error) {
    console.error("Status Callback Error:", error);
    return res.status(200).send("OK");
  }
};

// 5. Get Call History for a Booking
const getBookingCallHistory = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const calls = await CallLog.find({ booking: bookingId }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, calls });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  initiateMaskedCall,
  getBridgeTwiML,
  handleInboundWebhook,
  handleStatusCallback,
  getBookingCallHistory,
};
