const Admin = require("../models/Admin");
const jwt = require("jsonwebtoken");

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id, role: "admin" }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

const registerAdmin = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const adminExists = await Admin.findOne({ email });

    if (adminExists) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const admin = await Admin.create({
      name,
      email,
      password,
      //       image: req.file ? `http://192.168.29.234:5000/uploads/${req.file.filename}` : "",
      image: req.file ? `http://192.168.29.234:5000/uploads/${req.file.filename}` : "",
    });

    if (admin) {
      res.status(201).json({
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        image: admin.image,
        token: generateToken(admin._id),
      });
    } else {
      res.status(400).json({ message: "Invalid admin data" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });

    if (admin && admin.password === password) {
      res.json({
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        token: generateToken(admin._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAdminProfile = async (req, res) => {
  const admin = await Admin.findById(req.admin.id);

  if (admin) {
    res.json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      image: admin.image,
    });
  } else {
    res.status(404).json({ message: "Admin not found" });
  }
};

const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  try {
    const admin = await Admin.findById(req.admin.id);

    if (admin && admin.password === oldPassword) {
      admin.password = newPassword;
      await admin.save();
      res.json({ message: "Password changed successfully" });
    } else {
      res.status(401).json({ message: "Invalid old password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);

    if (admin) {
      admin.name = req.body.name || admin.name;
      admin.email = req.body.email || admin.email;

      if (req.file) {
        //         admin.image = `http://192.168.29.234:5000/uploads/${req.file.filename}`;
        admin.image = `http://192.168.29.234:5000/uploads/${req.file.filename}`;
      }

      const updatedAdmin = await admin.save();

      res.json({
        _id: updatedAdmin._id,
        name: updatedAdmin.name,
        email: updatedAdmin.email,
        image: updatedAdmin.image,
      });
    } else {
      res.status(404).json({ message: "Admin not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const { getMessaging } = require("firebase-admin/messaging");
const User = require("../models/User");
const Notification = require("../models/Notification");

// Ensure firebase is initialized
require("../config/firebase");

const sendPushNotification = async (req, res) => {
  const { title, body, userId, category } = req.body;
  const messaging = require("firebase-admin/messaging").getMessaging();

  if (!title || !body) {
    return res.status(400).json({ message: "Title and body are required." });
  }

  try {
    let tokens = [];
    let notificationType = category || 'general';

    let imageUrl = null;
    if (req.file) {
      imageUrl = "/uploads/" + req.file.filename;
    }

    // Determine the users to send to
    if (userId && userId !== 'all') {
      const user = await User.findById(userId);
      if (user && user.fcmToken) {
        tokens.push(user.fcmToken);
      }
      
      await Notification.create({
        userId: user._id,
        title,
        body,
        type: notificationType,
        imageUrl: imageUrl
      });
    } else {
      const users = await User.find({ fcmToken: { $exists: true, $ne: "" } });
      tokens = users.map(user => user.fcmToken);
      
      await Notification.create({
        userId: null,
        title,
        body,
        type: notificationType,
        imageUrl: imageUrl
      });
    }

    if (tokens.length === 0) {
      return res.status(400).json({ success: false, message: "No valid FCM tokens found for the selected user(s)." });
    }

    let successCount = 0;
    let failureCount = 0;

    if (tokens.length === 1) {
      const message = {
        notification: { title, body, ...(imageUrl && { image: imageUrl }) },
        android: { priority: "high" },
        data: { type: notificationType, ...(imageUrl && { imageUrl: imageUrl }) },
        token: tokens[0]
      };
      await messaging.send(message);
      successCount = 1;
    } else {
      const message = {
        notification: { title, body, ...(imageUrl && { image: imageUrl }) },
        android: { priority: "high" },
        data: { type: notificationType, ...(imageUrl && { imageUrl: imageUrl }) },
        tokens: tokens
      };
      const response = await messaging.sendEachForMulticast(message);
      successCount = response.successCount;
      failureCount = response.failureCount;
    }
    return res.status(200).json({
      success: true,
      message: "Notification sent and saved.",
      successCount,
      failureCount
    });
  } catch (error) {
    console.error("Send Push Notification Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const triggerDailyRashiNotifications = async (req, res) => {
  try {
    const { sendDailyNotifications } = require("../cron/rashiNotificationJob");
    await sendDailyNotifications();
    res.json({ success: true, message: "Daily Rashi Notifications triggered successfully. Check server console for details." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerAdmin,
  loginAdmin,
  getAdminProfile,
  changePassword,
  updateAdminProfile,
  sendPushNotification,
  triggerDailyRashiNotifications,
};
