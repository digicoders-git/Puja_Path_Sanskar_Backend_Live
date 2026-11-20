const Booking = require("../models/Booking");
const User = require("../models/User");
const Pandit = require("../models/Pandit");
const CallLog = require("../models/CallLog");
const twilioService = require("../services/twilioService");
const omixoService = require("../services/omixoService");

// 1. Initiate Masked Call (User App -> Backend -> Omixo / Twilio Bridge)
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

    // Check Calling Providers Configuration (Omixo preferred, Twilio as fallback)
    const hasOmixo = omixoService.isConfigured();
    const hasTwilio = twilioService.isConfigured();

    if (!hasOmixo && !hasTwilio) {
      return res.status(503).json({
        success: false,
        isConfigured: false,
        message: "Call Masking सेवा सक्रिय नहीं है। कृपया .env में OMIXO_API_KEY या TWILIO_AUTH_TOKEN कॉन्फ़िगर करें।",
      });
    }

    const booking = await Booking.findById(bookingId)
      .populate("pandit", "fullName mobileNumber astrology")
      .populate("puja", "name pujaType")
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
    const panditPhone =
      booking.pandit.phone ||
      booking.pandit.mobileNumber ||
      booking.pandit.mobile;

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

    let result;
    if (hasOmixo) {
      // Use Omixo Click-to-Call (User phone rings first, then bridges to Pandit)
      result = await omixoService.initiateClickToCall({
        userPhone,
        panditPhone,
      });
    } else {
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
      result = await twilioService.initiateMaskedCall({
        userPhone,
        panditPhone,
        userName: booking.user.name || "भक्त जन",
        panditName: booking.pandit.fullName || "पंडित जी",
        twimlUrl,
        statusCallbackUrl,
      });
    }

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

// 6. Initiate Astrologer Masked Call (User App -> Backend -> Omixo / Twilio Bridge)
const initiateAstrologerMaskedCall = async (req, res) => {
  try {
    const { astrologerId, consultationId, userPhoneOverride } = req.body;
    const userId = req.user.id || req.user._id;

    if (!astrologerId && !consultationId) {
      return res.status(400).json({
        success: false,
        message: "Astrologer ID या Consultation ID आवश्यक है।",
      });
    }

    const hasOmixo = omixoService.isConfigured();
    const hasTwilio = twilioService.isConfigured();

    if (!hasOmixo && !hasTwilio) {
      return res.status(503).json({
        success: false,
        isConfigured: false,
        message: "Call Masking सेवा सक्रिय नहीं है। कृपया .env में OMIXO_API_KEY या TWILIO_AUTH_TOKEN कॉन्फ़िगर करें।",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "उपयोगकर्ता नहीं मिला।" });
    }

    const Astrologer = require("../models/Astrologer");
    let astrologer = null;

    if (astrologerId) {
      astrologer = await Astrologer.findById(astrologerId);
    } else if (consultationId) {
      const ConsultationBooking = require("../models/ConsultationBooking");
      const consultation = await ConsultationBooking.findById(consultationId).populate("astrologer");
      if (consultation) astrologer = consultation.astrologer;
    }

    if (!astrologer) {
      return res.status(404).json({ success: false, message: "ज्योतिषी नहीं मिले।" });
    }

    const astrologerPhone = (astrologer.phone || astrologer.mobile || "").toString().trim();
    if (!astrologerPhone) {
      return res.status(400).json({
        success: false,
        message: "ज्योतिषी जी का संपर्क नंबर एडमिन पैनल में दर्ज नहीं है।",
      });
    }

    const userPhone = userPhoneOverride || user.mobile;
    if (!userPhone) {
      return res.status(400).json({
        success: false,
        message: "आपका मोबाइल नंबर उपलब्ध नहीं है। कृपया पहले प्रोफाइल में मोबाइल नंबर दर्ज करें।",
      });
    }

    const AstrologyCallSession = require("../models/AstrologyCallSession");
    let activeSession = await AstrologyCallSession.findOne({
      user: user._id,
      astrologer: astrologer._id,
      status: "active",
      remainingSeconds: { $gt: 10 },
    }).sort({ createdAt: -1 });

    // If no active session found or duration passed from body, create or track session
    const durationMinutes = Number(req.body.durationMinutes) || (activeSession ? Math.ceil(activeSession.remainingSeconds / 60) : 10);
    const maxSeconds = activeSession ? activeSession.remainingSeconds : durationMinutes * 60;
    const ttlMinutes = Math.max(1, Math.ceil(maxSeconds / 60));

    if (!activeSession) {
      activeSession = await AstrologyCallSession.create({
        user: user._id,
        astrologer: astrologer._id,
        totalDurationSeconds: maxSeconds,
        remainingSeconds: maxSeconds,
        consumedSeconds: 0,
        status: "active",
        planTitle: req.body.planTitle || `${durationMinutes} Min Consultation`,
        amount: Number(req.body.amount) || 0,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours validity for unused minutes
      });
    }

    let result;
    if (hasOmixo) {
      // Omixo Click-to-Call: User phone rings first, then bridges to Astrologer
      result = await omixoService.initiateClickToCall({
        userPhone,
        panditPhone: astrologerPhone,
        ttlMinutes,
        maxDurationSeconds: maxSeconds,
      });
    } else {
      const baseUrl =
        process.env.BASE_URL && !process.env.BASE_URL.includes("localhost")
          ? process.env.BASE_URL
          : "https://api.pujapathsanskar.com";

      const twimlUrl = `${baseUrl}/api/calls/astrologer-bridge-twiml/${astrologer._id}`;
      result = await twilioService.initiateMaskedCall({
        userPhone,
        panditPhone: astrologerPhone,
        userName: user.name || "भक्त जन",
        panditName: astrologer.name || "ज्योतिषी जी",
        twimlUrl,
      });
    }

    // Update active session with lastCallSid
    activeSession.lastCallSid = result.callSid;
    await activeSession.save();

    // Save CallLog for audit
    await CallLog.create({
      user: user._id,
      astrologer: astrologer._id,
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
      astrologerPhoneMasked: result.panditPhoneMasked,
      sessionId: activeSession._id,
      remainingSeconds: activeSession.remainingSeconds,
    });
  } catch (error) {
    console.error("Astrologer Masked Call Error:", error);
    let msg = error.message || "कॉल कनेक्ट करने में त्रुटि हुई।";
    const lower = msg.toLowerCase();
    if (
      lower.includes("busy") ||
      lower.includes("channel") ||
      lower.includes("in use") ||
      lower.includes("originate") ||
      lower.includes("active")
    ) {
      msg =
        "कॉल लाइन अभी व्यस्त है या पिछली कॉल अभी रिंग हो रही है। कृपया 15-20 सेकंड बाद पुनः प्रयास करें।";
    }
    return res.status(500).json({
      success: false,
      message: msg,
    });
  }
};

// 7. Astrologer Bridge TwiML (for Twilio fallback)
const getAstrologerBridgeTwiML = async (req, res) => {
  try {
    const { astrologerId } = req.params;
    const Astrologer = require("../models/Astrologer");
    const astrologer = await Astrologer.findById(astrologerId);

    if (!astrologer || (!astrologer.phone && !astrologer.mobile)) {
      res.type("text/xml");
      return res.send(
        `<?xml version="1.0" encoding="UTF-8"?><Response><Say language="hi-IN">ज्योतिषी जी का नंबर उपलब्ध नहीं है।</Say></Response>`
      );
    }

    const xml = twilioService.generateBridgeTwiML({
      userName: "भक्त जन",
      panditName: astrologer.name || "ज्योतिषी जी",
      panditPhone: astrologer.phone || astrologer.mobile,
    });

    res.type("text/xml");
    return res.send(xml);
  } catch (error) {
    console.error("Astrologer Bridge TwiML Error:", error);
    res.type("text/xml");
    return res.send(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Say language="hi-IN">तकनीकी त्रुटि हुई।</Say></Response>`
    );
  }
};

// 8. Omixo Webhook (Fired on call events like call_connected, call_completed)
const handleOmixoWebhook = async (req, res) => {
  try {
    const eventData = req.body || {};
    console.log("Omixo Webhook Received:", JSON.stringify(eventData));

    const event = eventData.event || eventData.type;
    const session_id = eventData.session_id || eventData.call_id || eventData.id;
    const duration = Number(eventData.duration) || 0;
    const talk_seconds_left = eventData.talk_seconds_left !== undefined ? Number(eventData.talk_seconds_left) : null;
    const caller = eventData.caller || "";
    const disposition = (eventData.disposition || "").toUpperCase();

    // Only process if call was completed/ended
    if (event === "call_completed" || event === "call.completed" || disposition) {
      const AstrologyCallSession = require("../models/AstrologyCallSession");

      // Find by lastCallSid or session_id
      let session = null;
      if (session_id) {
        session = await AstrologyCallSession.findOne({
          $or: [
            { lastCallSid: session_id.toString() },
            { _id: mongoose.Types.ObjectId.isValid(session_id) ? session_id : null },
          ],
        });
      }

      // If not found by SID, find the latest active session by caller phone
      if (!session && caller) {
        const User = require("../models/User");
        const cleanPhone = caller.toString().replace(/\D/g, "").slice(-10);
        const user = await User.findOne({ mobile: { $regex: cleanPhone } });
        if (user) {
          session = await AstrologyCallSession.findOne({
            user: user._id,
            status: "active",
          }).sort({ updatedAt: -1 });
        }
      }

      if (session) {
        // Only deduct if call was actually answered and talk duration > 5 seconds
        // Prevent deduction if call was just ringing, busy, or dropped without connect
        const wasAnswered = disposition === "ANSWERED" || duration > 5;
        
        if (wasAnswered) {
          session.consumedSeconds = (session.consumedSeconds || 0) + duration;
          
          if (talk_seconds_left !== null && !isNaN(talk_seconds_left) && talk_seconds_left >= 0) {
            session.remainingSeconds = talk_seconds_left;
          } else {
            session.remainingSeconds = Math.max(0, session.totalDurationSeconds - session.consumedSeconds);
          }

          if (session.remainingSeconds <= 15) {
            session.status = "completed";
            session.remainingSeconds = 0;
          }
          await session.save();
          console.log(`Astrology Session Updated (Answered): ID=${session._id}, Consumed=${session.consumedSeconds}s, Remaining=${session.remainingSeconds}s, Status=${session.status}`);
        } else {
          console.log(`Astrology Call NOT Answered/Too Short (Disposition=${disposition}, Duration=${duration}s). Balance NOT deducted. Remaining=${session.remainingSeconds}s`);
        }
      }

      // Update CallLog if present
      if (session_id) {
        await CallLog.updateMany(
          { callSid: session_id.toString() },
          {
            $set: {
              status: "completed",
              duration: duration,
            },
          }
        );
      }
    }

    return res.status(200).json({ success: true, message: "Webhook processed" });
  } catch (error) {
    console.error("Omixo Webhook Error:", error);
    return res.status(200).json({ success: true, message: "Webhook error handled" });
  }
};

module.exports = {
  initiateMaskedCall,
  getBridgeTwiML,
  handleInboundWebhook,
  handleStatusCallback,
  getBookingCallHistory,
  initiateAstrologerMaskedCall,
  getAstrologerBridgeTwiML,
  handleOmixoWebhook,
};
