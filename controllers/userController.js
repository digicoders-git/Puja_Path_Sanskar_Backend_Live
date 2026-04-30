const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id, role: "user" }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// Send OTP
const sendOtp = async (req, res) => {
  const { mobile } = req.body;

  if (!mobile) {
    return res.status(400).json({ message: "Mobile number is required" });
  }


  res.status(200).json({ 
    message: "OTP sent successfully (Fixed to 123456)", 
    mobile,
    success: true
  });
};

// Verify OTP & Login/Register
const verifyOtp = async (req, res) => {
  const { mobile, otp, name } = req.body;
  if (!mobile || !otp) {
    return res.status(400).json({ message: "Mobile and OTP are required" });
  }

  // Fix OTP verification
  if (otp !== "123456") {
    return res.status(400).json({ message: "Invalid OTP", success: false });
  }

  try {
    // Check karte hain ki user pehle se hai ya nahi
    let user = await User.findOne({ mobile });
    let isNewUser = false;

    // Agar user nahi hai, toh naya user hai (Registration process)
    if (!user) {
      // Naye user ke liye 'name' dena zaroori hai
      if (!name) {
        return res.status(400).json({ 
          message: "Please give me a name", 
          success: false 
        });
      }

      // Agar name de diya hai toh create kar do
      user = await User.create({
        mobile,
        name: name,
      });
      isNewUser = true;
    }

    // Response bhejna (Naya hai toh Registration, Purana hai toh Login)
    res.status(200).json({
      message: isNewUser ? "Registration successful" : "Login successful",
      success: true,
      _id: user._id,
      name: user.name,
      mobile: user.mobile,
      token: generateToken(user._id),
    });

  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

// Get all users for Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

// Update User
const updateUser = async (req, res) => {
  try {
    const { name, mobile } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found", success: false });

    if (name) user.name = name;
    if (mobile) user.mobile = mobile;

    const updatedUser = await user.save();
    res.json({ message: "User updated successfully", success: true, user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

// Delete User
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found", success: false });

    await user.deleteOne();
    res.json({ message: "User deleted successfully", success: true });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

// Toggle User Status (Active/Inactive)
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found", success: false });

    user.isActive = !user.isActive;
    await user.save();
    res.json({ message: `User ${user.isActive ? "activated" : "deactivated"} successfully`, success: true, isActive: user.isActive });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  getAllUsers,
  updateUser,
  deleteUser,
  toggleUserStatus,
};
