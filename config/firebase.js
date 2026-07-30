const admin = require("firebase-admin");
const path = require("path");

try {
  if (admin.getApps().length === 0) {
    const serviceAccount = require(path.join(__dirname, "firebase-service-account.json"));
    admin.initializeApp({
      credential: admin.cert(serviceAccount),
    });
    console.log("Firebase Admin initialized successfully globally.");
  }
} catch (error) {
  console.error("Firebase Admin initialization failed. Ensure firebase-service-account.json exists in config folder.", error.message);
}

module.exports = admin;
