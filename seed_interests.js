const mongoose = require("mongoose");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const Interest = require("./models/Interest");
const User = require("./models/User");
const Puja = require("./models/Puja");

dotenv.config();

const seedInterests = async () => {
  try {
    await connectDB();

    const user = await User.findOne();
    const puja = await Puja.findOne();

    if (!user || !puja) {
      console.log("Please ensure there is at least one User and one Puja in the database.");
      process.exit(1);
    }

    const statuses = ["Pending", "Contacted", "Converted", "Dropped"];
    const interests = [];

    for (let i = 0; i < 100; i++) {
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - Math.floor(Math.random() * 30));

      interests.push({
        puja: puja._id,
        user: user._id,
        name: `Lead User ${i + 1}`,
        mobile: `9876543${String(i).padStart(3, '0')}`,
        message: i % 3 === 0 ? "I want to know more about this puja and the cost." : "Please call me back.",
        status: randomStatus,
        adminNotes: randomStatus === "Contacted" ? "Called them once, asked to call later." : "",
        createdAt: pastDate,
        updatedAt: pastDate
      });
    }

    await Interest.insertMany(interests);
    console.log("Successfully inserted 100 dummy interests/leads!");
    process.exit(0);
  } catch (error) {
    console.error("Error inserting interests:", error);
    process.exit(1);
  }
};

seedInterests();
