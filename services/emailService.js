const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

// Create Transporter Dynamically
const getTransporter = () => nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "pujapathsanskarkd@gmail.com",
    pass: process.env.EMAIL_PASS || "jbmoyxwerlfiubgd",
  },
});

const getAdminEmail = () => process.env.EMAIL_USER || "pujapathsanskarkd@gmail.com";
const THEME_COLOR = "#e8621a";

// Base HTML Wrapper
const wrapHtml = (title, content) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
    .header { background-color: ${THEME_COLOR}; color: #ffffff; padding: 20px; text-align: center; }
    .header h2 { margin: 0; font-size: 24px; letter-spacing: 1px; }
    .content { padding: 30px; color: #333333; line-height: 1.6; }
    .content p { margin-top: 0; font-size: 16px; }
    .card { background-color: #fafafa; border: 1px solid #eeeeee; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .detail-row { display: flex; margin-bottom: 10px; border-bottom: 1px dashed #dddddd; padding-bottom: 5px; }
    .detail-label { font-weight: bold; width: 140px; color: #555555; }
    .detail-value { flex: 1; color: #222222; }
    .footer { background-color: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #888888; border-top: 1px solid #eeeeee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>${title}</h2>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Puja Path Sanskar. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

// 1. Pandit Registration Email
exports.sendPanditRegistrationEmail = async (pandit) => {
  try {
    const subject = "🎉 New Pandit Registration!";
    const content = `
      <p>Hello Admin,</p>
      <p>A new Pandit has just registered on the platform. Here are the details:</p>
      <div class="card">
        <div class="detail-row"><span class="detail-label">Name:</span> <span class="detail-value">${pandit.fullName || "N/A"}</span></div>
        <div class="detail-row"><span class="detail-label">Mobile:</span> <span class="detail-value">${pandit.mobileNumber || "N/A"}</span></div>
        <div class="detail-row"><span class="detail-label">City:</span> <span class="detail-value">${pandit.city || "N/A"}, ${pandit.state || ""}</span></div>
        <div class="detail-row"><span class="detail-label">Experience:</span> <span class="detail-value">${pandit.panditExperience || "N/A"}</span></div>
      </div>
      <p>Please review their profile in the Admin Panel to verify and activate their account.</p>
    `;

    await getTransporter().sendMail({
      from: `"Puja Path Sanskar" <${getAdminEmail()}>`,
      to: getAdminEmail(),
      subject,
      html: wrapHtml("New Pandit Registration", content),
    });
    console.log("Pandit Registration Email sent to Admin.");
  } catch (error) {
    console.error("Error sending Pandit Registration Email:", error);
  }
};

// 2. Puja Booking Email
exports.sendPujaBookingEmail = async (booking, pujaName, panditName, userName) => {
  try {
    const subject = "🙏 New Puja Booking Received!";
    const content = `
      <p>Hello Admin,</p>
      <p>A new Puja Booking has been made successfully. Here are the details:</p>
      <div class="card">
        <div class="detail-row"><span class="detail-label">User Name:</span> <span class="detail-value">${userName || "N/A"}</span></div>
        <div class="detail-row"><span class="detail-label">Puja Name:</span> <span class="detail-value">${pujaName || "N/A"}</span></div>
        <div class="detail-row"><span class="detail-label">Pandit:</span> <span class="detail-value">${panditName || "No Preference (Any)"}</span></div>
        <div class="detail-row"><span class="detail-label">Date & Time:</span> <span class="detail-value">${new Date(booking.bookingDate).toLocaleDateString()} | ${booking.timeSlot || "N/A"}</span></div>
        <div class="detail-row"><span class="detail-label">Amount:</span> <span class="detail-value">₹${booking.amount || 0}</span></div>
        <div class="detail-row"><span class="detail-label">Samagri:</span> <span class="detail-value">${booking.samagriOption || "None"}</span></div>
      </div>
      <p>Please check the Admin Panel for the full address and special instructions.</p>
    `;

    await getTransporter().sendMail({
      from: `"Puja Path Sanskar" <${getAdminEmail()}>`,
      to: getAdminEmail(),
      subject,
      html: wrapHtml("New Puja Booking", content),
    });
    console.log("Puja Booking Email sent to Admin.");
  } catch (error) {
    console.error("Error sending Puja Booking Email:", error);
  }
};

// 3. Astrologer Consultation Email
exports.sendAstrologerBookingEmail = async (consultation, astrologerName, userName) => {
  try {
    const subject = "🔮 New Astrologer Consultation Booked!";
    const content = `
      <p>Hello Admin,</p>
      <p>A new Astrologer Consultation has been booked. Here are the details:</p>
      <div class="card">
        <div class="detail-row"><span class="detail-label">User Name:</span> <span class="detail-value">${userName || "N/A"}</span></div>
        <div class="detail-row"><span class="detail-label">Astrologer:</span> <span class="detail-value">${astrologerName || "N/A"}</span></div>
        <div class="detail-row"><span class="detail-label">Consultation Mode:</span> <span class="detail-value">${consultation.consultationMode || "N/A"}</span></div>
        <div class="detail-row"><span class="detail-label">Plan / Topic:</span> <span class="detail-value">${consultation.topic || "General"}</span></div>
        <div class="detail-row"><span class="detail-label">Date & Time:</span> <span class="detail-value">${new Date(consultation.preferredDate).toLocaleDateString()} | ${consultation.preferredTime || "N/A"}</span></div>
        <div class="detail-row"><span class="detail-label">Amount:</span> <span class="detail-value">₹${consultation.amount || 0}</span></div>
      </div>
      <p>Please ensure the Astrologer is informed and the consultation is completed on time.</p>
    `;

    await getTransporter().sendMail({
      from: `"Puja Path Sanskar" <${getAdminEmail()}>`,
      to: getAdminEmail(),
      subject,
      html: wrapHtml("New Astrologer Booking", content),
    });
    console.log("Astrologer Consultation Email sent to Admin.");
  } catch (error) {
    console.error("Error sending Astrologer Booking Email:", error);
  }
};
