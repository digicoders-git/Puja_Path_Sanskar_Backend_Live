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
//       image: req.file ? `https://api.pujapathsanskar.com/uploads/${req.file.filename}` : "",
      image: req.file ? `https://api.pujapathsanskar.com/uploads/${req.file.filename}` : "",
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
//         admin.image = `https://api.pujapathsanskar.com/uploads/${req.file.filename}`;
        admin.image = `https://api.pujapathsanskar.com/uploads/${req.file.filename}`;
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

const adminFirebase = require("firebase-admin");
const User = require("../models/User");

const sendPushNotification = async (req, res) => {
  const { title, body } = req.body;

  if (!title || !body) {
    return res.status(400).json({ message: "Title and body are required." });
  }

  try {
    const users = await User.find({
      fcmToken: { $exists: true, $ne: "" }
    });

    if (users.length === 0) {
      return res.status(404).json({ message: "No users with FCM tokens found." });
    }

    const tokens = users.map(user => user.fcmToken);
    
    // We can send multicast up to 500 tokens per batch
    const message = {
      notification: {
        title,
        body
      },
      tokens: tokens
    };

    const response = await adminFirebase.messaging().sendEachForMulticast(message);
    
    res.json({
      success: true,
      message: "Notifications sent successfully.",
      successCount: response.successCount,
      failureCount: response.failureCount
    });
  } catch (error) {
    console.error("Send Push Notification Error:", error);
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
};
