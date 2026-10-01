const admin = require("firebase-admin");
try {
  admin.initializeApp({ projectId: "test" });
  const messaging = admin.messaging();
  const message = {
    notification: { title: "Test", body: "Test", image: "/uploads/test.png" },
    token: "test"
  };
  messaging.send(message).catch(e => console.error("Send Error:", e.message));
} catch (e) {
  console.error("Sync Error:", e.message);
}
