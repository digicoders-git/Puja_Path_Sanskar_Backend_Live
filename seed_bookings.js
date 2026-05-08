const mongoose = require("mongoose");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const Booking = require("./models/Booking");
const User = require("./models/User");
const Puja = require("./models/Puja");

dotenv.config();

const seedBookings = async () => {
  try {
    await connectDB();

    const user = await User.findOne();
    const puja = await Puja.findOne();

    if (!user || !puja) {
      console.log("Please ensure there is at least one User and one Puja in the database.");
      process.exit(1);
    }

    const statuses = ["Pending", "Confirmed", "Completed", "Cancelled"];
    const payStatuses = ["Pending", "Paid", "Failed"];
    const timeSlots = ["08:00 AM - 10:00 AM", "10:00 AM - 12:00 PM", "02:00 PM - 04:00 PM", "04:00 PM - 06:00 PM"];

    const bookings = [];

    for (let i = 0; i < 100; i++) {
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      const randomPayStatus = payStatuses[Math.floor(Math.random() * payStatuses.length)];
      const randomTimeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
      const randomAmount = Math.floor(Math.random() * 5000) + 1000;
      
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - Math.floor(Math.random() * 30));

      bookings.push({
        user: user._id,
        puja: puja._id,
        bookingDate: pastDate,
        timeSlot: randomTimeSlot,
        address: `Address ${i + 1}, Test City`,
        amount: randomAmount,
        status: randomStatus,
        paymentStatus: randomPayStatus,
        specialInstructions: `Special requirement for booking ${i + 1}`
      });
    }

    await Booking.insertMany(bookings);
    console.log("Successfully inserted 100 dummy bookings!");
    process.exit(0);
  } catch (error) {
    console.error("Error inserting bookings:", error);
    process.exit(1);
  }
};

seedBookings();
