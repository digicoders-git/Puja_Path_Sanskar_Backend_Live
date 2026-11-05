const User = require("../models/User");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { OAuth2Client } = require("google-auth-library");
const { getBaseUrl, formatMediaUrl } = require("../utils/urlHelper");
const CLIENT_ID = "335340683871-lllb03nursf6gg2emukftfmkgcuosiri.apps.googleusercontent.com";
const client = new OAuth2Client(CLIENT_ID);

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

  if (!/^[0-9]{10}$/.test(mobile)) {
    return res.status(400).json({ message: "Mobile number 10 digits ka hona chahiye" });
  }


  res.status(200).json({
    message: "OTP sent successfully (Fixed to 123456)",
    mobile,
    success: true
  });
};

// Verify OTP & Login/Register
const verifyOtp = async (req, res) => {
  const { mobile, otp, name, fcmToken, rashi } = req.body;
  if (!mobile || !otp) {
    return res.status(400).json({ message: "Mobile and OTP are required" });
  }

  if (!/^[0-9]{10}$/.test(mobile)) {
    return res.status(400).json({ message: "Mobile number 10 digits ka hona chahiye" });
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

      // Calculate rashi if not provided
      let calculatedRashi = rashi || 'Leo';
      if (!rashi && name) {
        if (name.toLowerCase().startsWith('a') || name.toLowerCase().startsWith('l')) calculatedRashi = 'Aries';
        else if (name.toLowerCase().startsWith('t') || name.toLowerCase().startsWith('v')) calculatedRashi = 'Taurus';
        else if (name.toLowerCase().startsWith('m')) calculatedRashi = 'Leo';
      }

      // Agar name de diya hai toh create kar do
      user = await User.create({
        mobile,
        name: name,
        fcmToken: fcmToken || "",
        rashi: calculatedRashi
      });
      isNewUser = true;
    } else {
      // Agar user pehle se hai, toh sirf FCM Token update kar do (if provided)
      if (fcmToken) {
        user.fcmToken = fcmToken;
        await user.save();
      }
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

// Google Login
const googleLogin = async (req, res) => {
  const { idToken, fcmToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ message: "Google ID Token is required", success: false });
  }

  try {
    let payload = null;

    // 1. Try verifyIdToken using google-auth-library
    try {
      const ticket = await client.verifyIdToken({
        idToken: idToken,
      });
      payload = ticket.getPayload();
    } catch (libErr) {
      console.warn("verifyIdToken failed, attempting Google TokenInfo API fallback:", libErr.message);
      // 2. Fallback to Google TokenInfo API
      try {
        const tokenInfoRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
        if (tokenInfoRes.data && (tokenInfoRes.data.sub || tokenInfoRes.data.user_id)) {
          payload = tokenInfoRes.data;
        } else {
          throw new Error("Token payload empty from Google TokenInfo API");
        }
      } catch (fallbackErr) {
        console.error("TokenInfo fallback error:", fallbackErr.response?.data || fallbackErr.message);
        throw new Error(libErr.message || fallbackErr.message);
      }
    }

    if (!payload || (!payload.sub && !payload.user_id)) {
      return res.status(400).json({ message: "Invalid Google token payload", success: false });
    }

    const googleId = payload.sub || payload.user_id;
    const rawEmail = payload.email || "";
    const email = rawEmail.trim().toLowerCase();
    const name = payload.name || payload.given_name || "User";
    const picture = payload.picture || "";

    // Check if user already exists
    // 1. Check by googleId
    let user = await User.findOne({ googleId });
    let isNewUser = false;

    // 2. If not found by googleId, check by case-insensitive email
    if (!user && email) {
      user = await User.findOne({
        email: { $regex: new RegExp("^" + email + "$", "i") }
      });
      if (user) {
        user.googleId = googleId;
        if (!user.name || user.name === "User") user.name = name;
        if (!user.profileImage || user.profileImage.includes("default")) {
          user.profileImage = picture;
        }
        if (fcmToken) user.fcmToken = fcmToken;
        await user.save();
      }
    }

    if (!user) {
      let calculatedRashi = 'Leo';
      if (name) {
        if (name.toLowerCase().startsWith('a') || name.toLowerCase().startsWith('l')) calculatedRashi = 'Aries';
        else if (name.toLowerCase().startsWith('t') || name.toLowerCase().startsWith('v')) calculatedRashi = 'Taurus';
        else if (name.toLowerCase().startsWith('m')) calculatedRashi = 'Leo';
      }

      user = await User.create({
        googleId,
        email,
        name,
        profileImage: picture,
        isActive: true,
        rashi: calculatedRashi,
        fcmToken: fcmToken || ""
      });
      isNewUser = true;
    } else {
      // User exists, update fcmToken and photo if needed
      if (fcmToken) {
        user.fcmToken = fcmToken;
      }
      if (!user.profileImage && picture) {
        user.profileImage = picture;
      }
      await user.save();
    }

    res.status(200).json({
      message: isNewUser ? "Registration successful" : "Login successful",
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile || "",
      profileImage: user.profileImage,
      token: generateToken(user._id),
      user: user,
    });

  } catch (error) {
    console.error("Google Auth verification error:", error);
    res.status(500).json({ message: error.message || "Invalid Google Token or Server Error", error: error.message, success: false });
  }
};

// Get My Profile (User)
const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id || req.user._id).select("-__v");
    if (!user) return res.status(404).json({ message: "User not found", success: false });
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

// Update My Profile (User)
const updateMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id || req.user._id);
    if (!user) return res.status(404).json({ message: "User not found", success: false });

    const { name, mobile, email, dateOfBirth, gender, fcmToken, rashi } = req.body;
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    if (gender !== undefined) user.gender = gender;
    if (fcmToken !== undefined) user.fcmToken = fcmToken;
    if (rashi !== undefined) user.rashi = rashi;

    // Image handling
    if (req.file) {
      user.profileImage = `${getBaseUrl(req)}/uploads/${req.file.filename}`;
    }

    if (mobile !== undefined && mobile !== "") {
      const cleanMobile = mobile.toString().trim();
      if (!/^[0-9]{10}$/.test(cleanMobile)) {
        return res.status(400).json({ message: "Mobile number 10 digits ka hona chahiye", success: false });
      }

      // Check if another account already exists with this mobile number
      const existingUser = await User.findOne({ mobile: cleanMobile, _id: { $ne: user._id } });

      if (existingUser) {
        // DYNAMIC ACCOUNT MERGE & LINKING:
        // The user verified via Google/token and wants to link this mobile number.
        // Merge the Google login / new details into existingUser
        const currentGoogleId = user.googleId;
        const currentEmail = user.email;
        const currentProfileImage = user.profileImage;
        const currentFcmToken = user.fcmToken;
        const currentName = user.name;

        // 1. Migrate any bookings, addresses, consultations from user._id to existingUser._id
        try {
          const Booking = require("../models/Booking");
          await Booking.updateMany({ user: user._id }, { user: existingUser._id });
        } catch (e) {
          console.warn("Booking migration notice:", e.message);
        }

        try {
          const Address = require("../models/Address");
          await Address.updateMany({ user: user._id }, { user: existingUser._id });
        } catch (e) {
          console.warn("Address migration notice:", e.message);
        }

        try {
          const ConsultationBooking = require("../models/ConsultationBooking");
          await ConsultationBooking.updateMany({ user: user._id }, { user: existingUser._id });
        } catch (e) {
          console.warn("ConsultationBooking migration notice:", e.message);
        }

        // 2. Delete temporary orphan user to release unique googleId index
        if (user._id.toString() !== existingUser._id.toString()) {
          await User.findByIdAndDelete(user._id);
        }

        // 3. Update existingUser with Google credentials & latest profile info
        if (currentGoogleId) existingUser.googleId = currentGoogleId;
        if (currentEmail && (!existingUser.email || existingUser.email === "")) existingUser.email = currentEmail;
        if (currentProfileImage && (!existingUser.profileImage || existingUser.profileImage === "" || existingUser.profileImage.includes("default"))) {
          existingUser.profileImage = currentProfileImage;
        }
        if (currentFcmToken) existingUser.fcmToken = currentFcmToken;
        if (name !== undefined && name.trim()) existingUser.name = name.trim();
        else if (currentName && (!existingUser.name || existingUser.name === "User")) existingUser.name = currentName;
        if (dateOfBirth !== undefined) existingUser.dateOfBirth = dateOfBirth;
        if (gender !== undefined) existingUser.gender = gender;
        if (rashi !== undefined) existingUser.rashi = rashi;

        const savedUser = await existingUser.save();
        const newToken = generateToken(savedUser._id);

        return res.status(200).json({
          success: true,
          message: "खाता सफलतापूर्वक लिंक हो गया!",
          user: savedUser,
          token: newToken,
          isMerged: true,
        });
      }

      user.mobile = cleanMobile;
    }

    const updatedUser = await user.save();
    res.status(200).json({ success: true, message: "Profile updated successfully", user: updatedUser });
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
    const { name, mobile, email, dateOfBirth, gender } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found", success: false });

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    if (gender !== undefined) user.gender = gender;
    if (mobile !== undefined) user.mobile = mobile;

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
  getMyProfile,
  updateMyProfile,
  getAllUsers,
  updateUser,
  deleteUser,
  toggleUserStatus,
  googleLogin,
};
