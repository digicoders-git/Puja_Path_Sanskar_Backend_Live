const express = require("express");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const fs = require("fs");

dotenv.config();
connectDB();

const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:3000",
  "http://192.168.29.34:5173",
  "http://192.168.29.34:5174",
  "http://192.168.29.34:3000",
  "https://pujapathsanskar.com",
  "https://www.pujapathsanskar.com",
  "https://puja-path-sanskar-website-live.vercel.app",
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o)) || origin.endsWith(".vercel.app")) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));


app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("API Running...");
});

app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/pandits", require("./routes/panditRoutes"));
app.use("/api/contacts", require("./routes/contactRoutes"));
app.use("/api/pujas", require("./routes/pujaRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/interests", require("./routes/interestRoutes"));
app.use("/api/astrology", require("./routes/astrologyRoutes"));
app.use("/api/astrologers", require("./routes/astrologerRoutes"));
app.use("/api/consultations", require("./routes/consultationRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use("/api/offers", require("./routes/offerRoutes"));
app.use("/api/puja-types", require("./routes/pujaTypeRoutes"));
app.use("/api/addresses", require("./routes/addressRoutes"));
app.use("/api/horoscope", require("./routes/horoscope.routes"));

// Initialize Cron Jobs
require("./cron/horoscope.cron");
require("./cron/rashiNotificationJob").startNotificationJob();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on ${PORT}`));