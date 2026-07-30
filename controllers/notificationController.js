const Notification = require("../models/Notification");

// Fetch notifications for the logged-in user (including broadcast notifications)
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    // Fetch user-specific notifications AND broadcast notifications (userId: null)
    const notifications = await Notification.find({
      $or: [{ userId: userId }, { userId: null }]
    }).sort({ createdAt: -1 }).limit(50); // limit to recent 50

    // Fetch the read status (for broadcast, we might need a separate ReadReceipt model for perfection, 
    // but for now we'll just return them. For user-specific ones, isRead is sufficient)
    // To keep it simple, we'll mark all user-specific ones as fetched.
    
    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark a specific notification as read, or all as read
const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { notificationId } = req.body;

    if (notificationId) {
      // Mark specific
      await Notification.findOneAndUpdate(
        { _id: notificationId, userId: userId },
        { isRead: true }
      );
    } else {
      // Mark all
      await Notification.updateMany(
        { userId: userId, isRead: false },
        { isRead: true }
      );
    }

    res.json({ success: true, message: "Marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getUserNotifications,
  markAsRead
};
