const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();
app.use(cors());

app.use(express.json());
const path = require("path");
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on ${PORT}`));