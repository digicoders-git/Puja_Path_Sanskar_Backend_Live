const { getMessaging } = require("firebase-admin/messaging");
require('../config/firebase');
const cron = require('node-cron');
const path = require('path');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Function to generate daily Rashi text based on sign
function getDailyRashiMessage(name, rashi) {
    const messages = {
        'aries': 'मेष राशि वालों के लिए आज का दिन नए अवसर लाएगा।',
        'taurus': 'वृषभ राशि वालों के लिए आज धन लाभ का योग है।',
        'gemini': 'मिथुन राशि वालों को आज नए मित्रों से मिलने का अवसर मिलेगा।',
        'cancer': 'कर्क राशि वालों के लिए आज का दिन शांतिपूर्ण रहेगा।',
        'leo': 'सिंह राशि वालों को आज कार्यक्षेत्र में सफलता मिलेगी।',
        'virgo': 'कन्या राशि वालों को आज अपनी सेहत का ध्यान रखना चाहिए।',
        'libra': 'तुला राशि वालों के लिए आज का दिन परिवार के साथ अच्छा बीतेगा।',
        'scorpio': 'वृश्चिक राशि वालों को आज आर्थिक लाभ होने की संभावना है।',
        'sagittarius': 'धनु राशि वालों को आज यात्रा से लाभ हो सकता है।',
        'capricorn': 'मकर राशि वालों को आज मेहनत का फल मिलेगा।',
        'aquarius': 'कुंभ राशि वालों के लिए आज का दिन सृजनात्मक (creative) रहेगा।',
        'pisces': 'मीन राशि वालों को आज आध्यात्मिक शांति का अनुभव होगा।'
    };
    
    // Fallback if rashi is not recognized or not standard format
    let rashiKey = rashi ? rashi.toLowerCase() : '';
    let message = messages[rashiKey] || 'आज का दिन आपके लिए शुभ रहेगा।';
    
    return `नमस्ते ${name || 'भक्त'}! ${message} अपनी पूरी राशि पढ़ने के लिए ऐप खोलें।`;
}

// Send Notifications
async function sendDailyNotifications() {
    console.log("Starting daily Rashi notifications job...");
    
    try {
        // Find users who have FCM token
        const users = await User.find({
            fcmToken: { $exists: true, $ne: "" },
            isActive: true
        });

        console.log(`Found ${users.length} users with FCM tokens and Rashi to notify.`);
        
        let successCount = 0;
        let failCount = 0;

        for (const user of users) {
            const messageBody = getDailyRashiMessage(user.name, user.rashi);
            const title = `Aaj ka Rashifal - ${user.rashi.toUpperCase()}`;
            
            const message = {
                token: user.fcmToken,
                notification: {
                    title: title,
                    body: messageBody
                },
                android: {
                    priority: "high"
                },
                data: {
                    type: 'rashi',
                    sign: user.rashi.toLowerCase()
                }
            };
            
            try {
                await getMessaging().send(message);
                
                // Save to DB
                await Notification.create({
                    userId: user._id,
                    title: title,
                    body: messageBody,
                    type: "rashi"
                });
                
                successCount++;
            } catch (error) {
                console.error(`Error sending message to ${user.name} (${user.mobile}):`, error.message);
                failCount++;
            }
        }

        console.log(`Daily Rashi Notifications finished. Success: ${successCount}, Failed: ${failCount}`);
        
    } catch (error) {
         console.error("Error fetching users for notifications:", error.message);
    }
}

// Schedule the task to run every day at 7:00 AM
// "0 7 * * *" means 7:00 AM every day
const startNotificationJob = () => {
    cron.schedule('0 7 * * *', () => {
        sendDailyNotifications();
    });
    console.log("Rashi Notification Cron Job scheduled for 7:00 AM daily.");
};

module.exports = { startNotificationJob, sendDailyNotifications };
