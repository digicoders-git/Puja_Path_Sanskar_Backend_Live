const { getMessaging } = require("firebase-admin/messaging");
require('../config/firebase');
const cron = require('node-cron');
const path = require('path');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Function to generate daily Rashi text based on sign
function getDailyRashiMessage(name, rashi) {
    const messages = {
        'aries': 'मेष राशि: आज का दिन नए अवसर और सकारात्मक ऊर्जा लाएगा।',
        'mesh': 'मेष राशि: आज का दिन नए अवसर और सकारात्मक ऊर्जा लाएगा।',
        'taurus': 'वृषभ राशि: आज धन लाभ और कार्यक्षेत्र में उन्नति के योग हैं।',
        'vrishabh': 'वृषभ राशि: आज धन लाभ और कार्यक्षेत्र में उन्नति के योग हैं।',
        'gemini': 'मिथुन राशि: आज मित्रों से सहयोग और शुभ समाचार मिलेगा।',
        'mithun': 'मिथुन राशि: आज मित्रों से सहयोग और शुभ समाचार मिलेगा।',
        'cancer': 'कर्क राशि: आज का दिन शांतिपूर्ण रहेगा, परिवार का साथ मिलेगा।',
        'kark': 'कर्क राशि: आज का दिन शांतिपूर्ण रहेगा, परिवार का साथ मिलेगा।',
        'leo': 'सिंह राशि: आज आत्मविश्वास बढ़ेगा और कार्यों में सफलता मिलेगी।',
        'singh': 'सिंह राशि: आज आत्मविश्वास बढ़ेगा और कार्यों में सफलता मिलेगी।',
        'virgo': 'कन्या राशि: आज स्वास्थ्य का ध्यान रखें और योजनाबद्ध कार्य करें।',
        'kanya': 'कन्या राशि: आज स्वास्थ्य का ध्यान रखें और योजनाबद्ध कार्य करें।',
        'libra': 'तुला राशि: आज परिवार के साथ सुखद समय बीतेगा, व्यापार में लाभ होगा।',
        'tula': 'तुला राशि: आज परिवार के साथ सुखद समय बीतेगा, व्यापार में लाभ होगा।',
        'scorpio': 'वृश्चिक राशि: आज आर्थिक लाभ और नए कार्य प्रारंभ करने का उत्तम समय है।',
        'vrishchik': 'वृश्चिक राशि: आज आर्थिक लाभ और नए कार्य प्रारंभ करने का उत्तम समय है।',
        'sagittarius': 'धनु राशि: आज ज्ञान और भाग्य का साथ मिलेगा, यात्रा सुखद रहेगी।',
        'dhanu': 'धनु राशि: आज ज्ञान और भाग्य का साथ मिलेगा, यात्रा सुखद रहेगी।',
        'capricorn': 'मकर राशि: आज आपकी मेहनत रंग लाएगी, पद-प्रतिष्ठा में वृद्धि होगी।',
        'makar': 'मकर राशि: आज आपकी मेहनत रंग लाएगी, पद-प्रतिष्ठा में वृद्धि होगी।',
        'aquarius': 'कुंभ राशि: आज रचनात्मक विचारों से लाभ होगा, दिन शुभ रहेगा।',
        'kumbh': 'कुंभ राशि: आज रचनात्मक विचारों से लाभ होगा, दिन शुभ रहेगा।',
        'pisces': 'मीन राशि: आज आध्यात्मिक शांति और मनोकामना पूर्ति के योग हैं।',
        'meen': 'मीन राशि: आज आध्यात्मिक शांति और मनोकामना पूर्ति के योग हैं।'
    };

    let rashiClean = (rashi || '').toString().trim().toLowerCase();
    // Normalize common hindi script rashis
    const hindiMap = {
        'मेष': 'aries', 'वृषभ': 'taurus', 'मिथुन': 'gemini', 'कर्क': 'cancer',
        'सिंह': 'leo', 'कन्या': 'virgo', 'तुला': 'libra', 'वृश्चिक': 'scorpio',
        'धनु': 'sagittarius', 'मकर': 'capricorn', 'कुंभ': 'aquarius', 'मीन': 'pisces'
    };
    if (hindiMap[rashiClean]) {
        rashiClean = hindiMap[rashiClean];
    }

    const prediction = messages[rashiClean] || 'आज का दिन आपके लिए मंगलमय और शुभ रहेगा।';
    const userName = (name && name.trim().length > 0) ? name.trim() : 'भक्त';

    return {
        title: rashi ? `आज का राशिफल (${rashi})` : 'आज का दैनिक राशिफल ॐ',
        body: `नमस्ते ${userName} जी! ${prediction} अपना पूरा राशिफल और उपाय जानने के लिए ऐप खोलें।`
    };
}

// Send Notifications
async function sendDailyNotifications() {
    console.log("Starting daily 8:00 AM Rashi notifications job...");
    
    try {
        // Find active users
        const users = await User.find({ isActive: true });
        console.log(`Found ${users.length} active users to notify.`);
        
        let successCount = 0;
        let failCount = 0;

        for (const user of users) {
            const { title, body } = getDailyRashiMessage(user.name, user.rashi);
            
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
