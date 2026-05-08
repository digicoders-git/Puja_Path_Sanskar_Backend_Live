const Pandit = require("../models/Pandit");
const Puja = require("../models/Puja");
const Contact = require("../models/Contact");
const Admin = require("../models/Admin");
const User = require("../models/User");
const Booking = require("../models/Booking");
const Interest = require("../models/Interest");

const getDashboard = async (req, res) => {
  try {
    // Saara data ek saath fetch karo
    const [
      totalPandits,
      activePandits,
      inactivePandits,
      totalPujas,
      activePujas,
      totalContacts,
      totalAdmins,
      totalUsers,
      totalBookings,
      pendingBookings,
      totalInterests,
      recentPandits,
      recentContacts,
      recentPujas,
      recentBookings,
      specializationStats,
      cityStats,
      contactSubjectStats,
      pujaTypeStats,
    ] = await Promise.all([

      // Pandit counts
      Pandit.countDocuments(),
      Pandit.countDocuments({ isActive: true }),
      Pandit.countDocuments({ isActive: false }),

      // Puja counts
      Puja.countDocuments(),
      Puja.countDocuments({ isActive: true }),

      // Contact counts
      Contact.countDocuments(),

      // Admin counts
      Admin.countDocuments(),

      // User counts
      User.countDocuments(),

      // Booking counts
      Booking.countDocuments(),
      Booking.countDocuments({ status: "Pending" }),

      // Interest counts
      Interest.countDocuments(),

      // Recent 5 pandits
      Pandit.find()
        .select("fullName city specialization isActive createdAt profilePhoto")
        .sort({ createdAt: -1 })
        .limit(5),

      // Recent 5 contacts
      Contact.find()
        .select("fullName email subject createdAt")
        .sort({ createdAt: -1 })
        .limit(5),

      // Recent 5 pujas
      Puja.find()
        .select("pujaName pujaType isActive createdAt image")
        .sort({ createdAt: -1 })
        .limit(5),

      // Recent 5 bookings
      Booking.find()
        .populate("user", "name")
        .populate("puja", "pujaName")
        .select("bookingDate amount status paymentStatus createdAt")
        .sort({ createdAt: -1 })
        .limit(5),

      // Specialization wise pandit count
      Pandit.aggregate([
        { $group: { _id: "$specialization", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // City wise pandit count (top 5)
      Pandit.aggregate([
        { $group: { _id: "$city", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),

      // Contact subject wise count
      Contact.aggregate([
        { $group: { _id: "$subject", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Puja Type Stats
      Puja.aggregate([
        { $group: { _id: "$pujaType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    // Get total earnings from Admin wallets
    const adminsList = await Admin.find();
    const totalEarnings = adminsList.reduce((sum, a) => sum + (a.walletBalance || 0), 0);

    res.json({
      // Summary Cards
      summary: {
        totalPandits,
        activePandits,
        inactivePandits,
        totalPujas,
        activePujas,
        totalContacts,
        totalAdmins,
        totalUsers,
        totalBookings,
        pendingBookings,
        totalInterests,
        totalEarnings,
      },

      // Recent Data
      recentPandits,
      recentContacts,
      recentPujas,
      recentBookings,

      // Stats / Charts ke liye
      stats: {
        specializationStats,
        cityStats,
        contactSubjectStats,
        pujaTypeStats,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboard };
