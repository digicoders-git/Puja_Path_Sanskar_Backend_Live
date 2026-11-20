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

    // Support nested payload formats e.g. { event: "...", data: { ... } } or flat
    const data = eventData.data || eventData.payload || eventData;
    const event = (eventData.event || eventData.type || data.event || data.type || "").toString().toLowerCase();
    const session_id = data.session_id || data.call_id || data.id || data.callSid || eventData.session_id || eventData.call_id;
    const duration = Number(data.duration || data.billsec || data.talk_seconds || data.talk_duration || eventData.duration || eventData.billsec) || 0;
    const talk_seconds_left = data.talk_seconds_left !== undefined ? Number(data.talk_seconds_left) : (eventData.talk_seconds_left !== undefined ? Number(eventData.talk_seconds_left) : null);
    const caller = data.caller || data.from || data.agent || eventData.caller || eventData.from || "";
    const destination = data.destination || data.to || data.bridged_to || eventData.destination || "";
    const disposition = (data.disposition || data.status || eventData.disposition || eventData.status || "").toString().toUpperCase();

    console.log(`Processing Omixo Webhook: Event=${event}, SessionID=${session_id}, Duration=${duration}s, Disposition=${disposition}, Caller=${caller}`);

    const isEndEvent = event.includes("completed") || event.includes("ended") || event.includes("hangup") || event.includes("cdr") || disposition.length > 0 || duration > 0;

    if (isEndEvent) {
      const AstrologyCallSession = require("../models/AstrologyCallSession");

      // 1. Find by session_id or callSid
      let session = null;
      if (session_id) {
        session = await AstrologyCallSession.findOne({
          $or: [
            { lastCallSid: session_id.toString() },
            { _id: mongoose.Types.ObjectId.isValid(session_id) ? session_id : null },
          ],
        });
      }

      // 2. Fallback: Find latest active session by caller phone
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

      // 3. Fallback: If still not found, find most recent active session
      if (!session) {
        session = await AstrologyCallSession.findOne({ status: "active" }).sort({ updatedAt: -1 });
      }

      // Update Session
      if (session) {
        if (duration > 0) {
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
          console.log(`Astrology Session Updated: ID=${session._id}, Consumed=${session.consumedSeconds}s, Remaining=${session.remainingSeconds}s`);
        }
      }

      // 3. Update CallLog: Try session_id, or fallback to user's latest initiated call
      let logUpdated = false;
      if (session_id) {
        const updateRes = await CallLog.updateMany(
          { callSid: session_id.toString() },
          {
            $set: {
              status: disposition === "ANSWERED" || duration > 0 ? "completed" : "no-answer",
              duration: duration,
            },
          }
        );
        if (updateRes.matchedCount > 0) logUpdated = true;
      }

      // Fallback: If not matched by SID, update the most recent 'initiated' or astrologer call log
      if (!logUpdated) {
        const latestLog = await CallLog.findOne({
          astrologer: { $exists: true, $ne: null },
          duration: { $lte: 0 },
        }).sort({ createdAt: -1 });

        if (latestLog) {
          latestLog.status = disposition === "ANSWERED" || duration > 0 ? "completed" : (disposition.toLowerCase() || "completed");
          if (duration > 0) latestLog.duration = duration;
          if (session_id) latestLog.callSid = session_id.toString();
          await latestLog.save();
          console.log(`Updated Latest CallLog via Fallback: ID=${latestLog._id}, Duration=${latestLog.duration}s`);
        }
      }
    }

    return res.status(200).json({ success: true, message: "Webhook processed" });
  } catch (error) {
    console.error("Omixo Webhook Error:", error);
    return res.status(200).json({ success: true, message: "Webhook error handled" });
  }
};

// 9. Get Astrologer Call History & Consultation Sessions for User
const getUserAstrologyHistory = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const AstrologyCallSession = require("../models/AstrologyCallSession");
    const ConsultationBooking = require("../models/ConsultationBooking");

    // Match userId as either ObjectId or string
    const matchUserQuery = mongoose.Types.ObjectId.isValid(userId)
      ? { $in: [userId, new mongoose.Types.ObjectId(userId)] }
      : userId;

    // 1. Fetch all consultation sessions for this user
    let sessions = await AstrologyCallSession.find({ user: matchUserQuery })
      .populate("astrologer", "name specialty image phone mobile experience rating badge")
      .sort({ createdAt: -1 });

    // 2. Fallback: If no AstrologyCallSession found, check ConsultationBooking and auto-create session
    if (!sessions || sessions.length === 0) {
      const bookings = await ConsultationBooking.find({
        user: matchUserQuery,
        paymentStatus: "Paid",
      })
        .populate("astrologer", "name specialty image phone mobile experience rating badge")
        .sort({ createdAt: -1 });

      for (const b of bookings) {
        if (b.astrologer) {
          const totalSecs = (Number(b.amount) >= 250 ? 15 : 10) * 60;
          const newSession = await AstrologyCallSession.create({
            user: b.user,
            astrologer: b.astrologer._id,
            totalDurationSeconds: totalSecs,
            remainingSeconds: totalSecs,
            consumedSeconds: 0,
            status: "active",
            planTitle: `${Math.floor(totalSecs / 60)} Min Consultation`,
            amount: b.amount || 0,
            expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
          });
          const populated = await AstrologyCallSession.findById(newSession._id).populate(
            "astrologer",
            "name specialty image phone mobile experience rating badge"
          );
          if (populated) sessions.push(populated);
        }
      }
    }

    // 3. Fetch all call logs for this user with astrologers
    const callLogs = await CallLog.find({
      user: matchUserQuery,
      astrologer: { $exists: true, $ne: null },
    })
      .populate("astrologer", "name image specialty")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      sessions,
      callLogs,
    });
  } catch (error) {
    console.error("Astrology History Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 10. Direct Sync Call Duration from App when Call Ends
const recordCallDuration = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { astrologerId, durationSeconds, callSid } = req.body;
    const duration = Number(durationSeconds) || 0;

    if (!astrologerId) {
      return res.status(400).json({ success: false, message: "astrologerId is required" });
    }

    const AstrologyCallSession = require("../models/AstrologyCallSession");
    const CallLog = require("../models/CallLog");

    // Match astrologerId as either ObjectId or string
    const matchAstroQuery = mongoose.Types.ObjectId.isValid(astrologerId)
      ? { $in: [astrologerId, new mongoose.Types.ObjectId(astrologerId)] }
      : astrologerId;

    // 1. Update or deduct from active session
    let session = await AstrologyCallSession.findOne({
      user: userId,
      astrologer: matchAstroQuery,
      status: "active",
    }).sort({ createdAt: -1 });

    // Fallback if not matched by specific astrologer: update latest active session for user
    if (!session) {
      session = await AstrologyCallSession.findOne({
        user: userId,
        status: "active",
      }).sort({ createdAt: -1 });
    }

    if (session && duration > 0) {
      session.consumedSeconds = (session.consumedSeconds || 0) + duration;
      session.remainingSeconds = Math.max(0, session.totalDurationSeconds - session.consumedSeconds);
      if (session.remainingSeconds <= 15) {
        session.status = "completed";
        session.remainingSeconds = 0;
      }
      await session.save();
      console.log(`Direct Recorded Duration: User=${userId}, Astro=${astrologerId}, Duration=${duration}s, Remaining=${session.remainingSeconds}s`);
    }

    // 2. Update latest CallLog
    let log = null;
    if (callSid) {
      log = await CallLog.findOne({ callSid: callSid.toString() });
    }
    if (!log) {
      log = await CallLog.findOne({
        user: userId,
        astrologer: matchAstroQuery,
      }).sort({ createdAt: -1 });
    }
    if (!log) {
      log = await CallLog.findOne({
        user: userId,
        astrologer: { $exists: true, $ne: null },
      }).sort({ createdAt: -1 });
    }

    if (log) {
      if (duration > 0) {
        log.duration = duration;
        log.status = "completed";
      } else if (log.status === "initiated") {
        log.status = "completed";
      }
      await log.save();
      console.log(`Updated CallLog: ID=${log._id}, Duration=${log.duration}s, Status=${log.status}`);
    }

    return res.status(200).json({
      success: true,
      message: "Call duration recorded",
      remainingSeconds: session ? session.remainingSeconds : 0,
      consumedSeconds: session ? session.consumedSeconds : duration,
    });
  } catch (error) {
    console.error("Record Call Duration Error:", error);
    return res.status(500).json({ success: false, message: error.message });
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
  getUserAstrologyHistory,
  recordCallDuration,
};
