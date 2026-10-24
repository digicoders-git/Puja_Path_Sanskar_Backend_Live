const { getMessaging } = require("firebase-admin/messaging");
require('../config/firebase');
const cron = require('node-cron');
const path = require('path');
const User = require('../models/User');
const Notification = require('../models/Notification');
const tathaastuService = require('../services/tathaastu.service');

// Send Notifications
async function sendDailyNotifications() {
    console.log("Starting daily 8:00 AM Rashi notifications job with live TathaAstu Panchang...");
    
    try {
        // Find active users
        const users = await User.find({ isActive: true });
        console.log(`Found ${users.length} active users to notify.`);
        
        let successCount = 0;
        let failCount = 0;

        for (const user of users) {
            let title, body;
            try {
                const liveNotif = await tathaastuService.getDailyRashiNotificationMessage(user.name, user.rashi);
                title = liveNotif.title;
                body = liveNotif.body;
            } catch (err) {
                console.error("Error generating live notification for user:", user._id, err.message);
                title = user.rashi ? `आज का राशिफल (${user.rashi}) 🔮` : 'आज का दैनिक राशिफल ॐ';
                body = `नमस्ते ${user.name || 'भक्त'} जी! आज का दिन आपके लिए मंगलमय और शुभ रहे। अपना दैनिक राशिफल और उपाय देखने के लिए ऐप खोलें।`;
            }
            
            // 1. Always save in-app notification in DB so user sees it in notifications page
            try {
                await Notification.create({
                    userId: user._id,
                    title: title,
                    body: body,
                    type: "rashi"
                });
            } catch (dbErr) {
                console.error(`DB notification save error for ${user._id}:`, dbErr.message);
            }

            // 2. Send Push Notification via Firebase if user has fcmToken
            if (user.fcmToken && user.fcmToken.trim() !== "") {
                const message = {
                    token: user.fcmToken,
                    notification: {
                        title: title,
                        body: body
                    },
                    android: {
                        priority: "high"
                    },
                    data: {
                        type: 'rashi',
                        sign: (user.rashi || '').toLowerCase()
                    }
                };

                try {
                    await getMessaging().send(message);
                    successCount++;
                } catch (error) {
                    console.error(`Error sending push notification to ${user.name} (${user.mobile}):`, error.message);
                    failCount++;
                }
            }
        }

        console.log(`Daily Rashi Notifications finished. Sent push to: ${successCount}, Failed: ${failCount}`);
        
    } catch (error) {
         console.error("Error running daily rashi notifications:", error.message);
    }
}

// Schedule the task to run every day at 8:00 AM
// "0 8 * * *" means 8:00 AM every day
const startNotificationJob = () => {
    cron.schedule('0 8 * * *', () => {
        console.log("Triggering scheduled 8:00 AM Rashi Notifications...");
        sendDailyNotifications();
    });
    console.log("Rashi Notification Cron Job scheduled for 8:00 AM daily.");
};

module.exports = { startNotificationJob, sendDailyNotifications };
