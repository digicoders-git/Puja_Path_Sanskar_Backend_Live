const mongoose = require("mongoose");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const User = require("./models/User");

dotenv.config();

const seedUsers = async () => {
  try {
    await connectDB();

    const users = [];
    const firstNames = ["Aarav", "Vihaan", "Aditya", "Arjun", "Sai", "Rohan", "Krishna", "Ishaan", "Shaurya", "Atharv", "Diya", "Ananya", "Myra", "Saanvi", "Pari", "Kavya", "Aadhya", "Riya", "Aarohi", "Neha"];
    const lastNames = ["Sharma", "Verma", "Gupta", "Singh", "Kumar", "Patel", "Das", "Joshi", "Mishra", "Reddy", "Rao", "Yadav", "Chauhan", "Bhat", "Mehta"];

    for (let i = 0; i < 50; i++) {
      const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      
      // Generate a unique 10-digit mobile number
      const randomMobile = "9" + Math.floor(100000000 + Math.random() * 900000000).toString();
      
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - Math.floor(Math.random() * 60)); // Random registration date up to 60 days ago

      users.push({
        name: `${randomFirstName} ${randomLastName}`,
        mobile: randomMobile,
        role: "user",
        isActive: Math.random() > 0.1, // 90% chance to be active
        createdAt: pastDate,
        updatedAt: pastDate
      });
    }

    // Use unordered insertMany to ignore duplicate mobile number errors if they miraculously happen
    await User.insertMany(users, { ordered: false });
    
    console.log("Successfully inserted 50 dummy app users!");
    process.exit(0);
  } catch (error) {
    if (error.code === 11000) {
      console.log("Inserted users, ignoring some duplicate mobile numbers.");
      process.exit(0);
    } else {
      console.error("Error inserting users:", error);
      process.exit(1);
    }
  }
};

seedUsers();
