const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function testEmail() {
  console.log("Testing email with:");
  console.log("USER:", process.env.EMAIL_USER);
  console.log("PASS:", process.env.EMAIL_PASS ? "********" : "NOT SET");

  try {
    await transporter.verify();
    console.log("✅ Nodemailer successfully verified SMTP connection!");
    
    const info = await transporter.sendMail({
      from: `"Puja Path Sanskar" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: "Test Email Setup",
      text: "If you are reading this, the email setup is working perfectly!",
    });

    console.log("✅ Test email sent! Message ID:", info.messageId);
  } catch (error) {
    console.error("❌ Email test failed:", error);
  }
}

testEmail();
