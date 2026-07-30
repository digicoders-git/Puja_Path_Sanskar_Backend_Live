require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const fcmUsers = await User.find({ fcmToken: { $exists: true, $ne: "" } });
    console.log("Users with FCM:");
    fcmUsers.forEach(u => console.log(`Name: ${u.name}, Rashi: ${u.rashi}, Token: ${u.fcmToken.substring(0, 10)}...`));
    process.exit(0);
}).catch(console.error);
