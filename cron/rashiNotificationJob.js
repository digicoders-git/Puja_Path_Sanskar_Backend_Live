const admin = require('firebase-admin');
const cron = require('node-cron');
const path = require('path');
const User = require('../models/User');

// Initialize Firebase Admin
try {
  const serviceAccount = require(path.join(__dirname, '../config/firebase-service-account.json'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("Firebase Admin initialized successfully.");
} catch (error) {
  console.error("Firebase Admin initialization failed. Ensure firebase-service-account.json exists in config folder.", error.message);
}

// Function to generate daily Rashi text based on sign
function getDailyRashiMessage(name, rashi) {
    const messages = {
        'aries': 'Mesh rashi walo ke liye aaj ka din naye avsar layega.',
        'taurus': 'Vrishabha rashi walo ke liye aaj dhan laabh ka yog hai.',
        'gemini': 'Mithun rashi walo ko aaj naye mitron se milne ka avsar milega.',
        'cancer': 'Kark rashi walo ke liye aaj ka din shantipurna rahega.',
        'leo': 'Singh rashi walo ko aaj karyakshetra mein safalta milegi.',
        'virgo': 'Kanya rashi walo ko aaj apni sehat ka dhyan rakhna chahiye.',
        'libra': 'Tula rashi walo ke liye aaj ka din parivar ke sath achha beetyga.',
        'scorpio': 'Vrishchik rashi walo ko aaj aarthik laabh hone ki sambhavna hai.',
        'sagittarius': 'Dhanu rashi walo ko aaj yatra se laabh ho sakta hai.',
        'capricorn': 'Makar rashi walo ko aaj mehnat ka fal milega.',
        'aquarius': 'Kumbh rashi walo ke liye aaj ka din srijanatmak (creative) rahega.',
        'pisces': 'Meen rashi walo ko aaj adhyatmik shanti ka anubhav hoga.'
    };
    
    // Fallback if rashi is not recognized or not standard format
    let rashiKey = rashi ? rashi.toLowerCase() : '';
    let message = messages[rashiKey] || 'Aaj ka din aapke liye shubh rahega.';
    
    return `Namaste ${name || 'Bhakta'}! ${message} Apni puri rashi padhne ke liye click karein.`;
}

// Send Notifications
async function sendDailyNotifications() {
    console.log("Starting daily Rashi notifications job...");
    
    try {
        // Find users who have both FCM token and Rashi set
        const users = await User.find({
            fcmToken: { $exists: true, $ne: "" },
            rashi: { $exists: true, $ne: "" },
            isActive: true
        });

        console.log(`Found ${users.length} users with FCM tokens and Rashi to notify.`);
        
        let successCount = 0;
        let failCount = 0;

        for (const user of users) {
            const messageBody = getDailyRashiMessage(user.name, user.rashi);
            
            const message = {
                token: user.fcmToken,
                notification: {
                    title: `Aaj ka Rashifal - ${user.rashi.toUpperCase()}`,
                    body: messageBody
                },
                data: {
                    type: 'rashi',
                    sign: user.rashi.toLowerCase()
                }
            };
            
            try {
                await admin.messaging().send(message);
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
