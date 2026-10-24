require("dotenv").config();
const mongoose = require("mongoose");
const Pandit = require("../models/Pandit");
const Puja = require("../models/Puja");
const User = require("../models/User");
const Booking = require("../models/Booking");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  const mobileNumber = "8112580707";
  const fullName = "पंडित शास्त्री जी महाराज";

  // Check if pandit already exists
  let pandit = await Pandit.findOne({ mobileNumber });

  if (pandit) {
    console.log("Pandit with mobile " + mobileNumber + " already exists. Updating active status...");
    pandit.isActive = true;
    pandit.fullName = fullName;
    await pandit.save();
  } else {
    // Fetch all active pujas to associate with this pandit
    const pujas = await Puja.find().limit(10);
    const selectedPujas = pujas.map((p) => ({
      puja: p._id,
      price: 2100,
    }));

    pandit = await Pandit.create({
      fullName: fullName,
      mobileNumber: mobileNumber,
      whatsappNumber: mobileNumber,
      state: "Uttar Pradesh",
      city: "Lucknow",
      district: "Lucknow",
      experience: "7+ Years",
      specializations: ["Satyanarayan Katha", "Havan", "Vivah", "Rudrabhishek"],
      languages: ["Hindi", "Sanskrit"],
      idProof: "uploads/default_id_proof.jpg",
      profilePhoto: "https://api.pujapathsanskar.com/uploads/1781290711213-1000146710.jpg",
      serviceArea: "Entire City",
      samagriArrangement: "Yes",
      samagriExperience: "Full Setup",
      travelAvailability: "Only Local Area",
      liveEventExperience: ["Mandir Event", "Jagran", "Bhagwat Katha"],
      selectedPujas: selectedPujas,
      currentAddress: "Hazratganj, Lucknow",
      permanentAddress: "Hazratganj, Lucknow",
      pincode: "226001",
      latitude: 26.8467,
      longitude: 80.9462,
      mapAddress: "Hazratganj, Lucknow, Uttar Pradesh",
      trainingGurukul: "Sampurnanand Sanskrit Vishwavidyalaya, Varanasi",
      traditionalDress: "Always",
      audioClarity: "Yes",
      declaration: true,
      isActive: true,
    });
    console.log("✅ Pandit created successfully with ID:", pandit._id);
  }

  // Also check if User Gaurav Gupta (9696559848) exists to provide a test booking
  const user = await User.findOne({ mobile: /9696559848/ });
  if (user) {
    let existingBooking = await Booking.findOne({
      user: user._id,
      pandit: pandit._id,
      status: "Confirmed",
    });

    if (!existingBooking) {
      const samplePuja = await Puja.findOne();
      existingBooking = await Booking.create({
        user: user._id,
        pandit: pandit._id,
        puja: samplePuja ? samplePuja._id : undefined,
        bookingDate: new Date(),
        timeSlot: "09:00 AM - 11:00 AM",
        samagriOption: "Basic",
        address: "Gomti Nagar, Lucknow, Uttar Pradesh",
        amount: 2100,
        advanceAmount: 525,
        remainingAmount: 1575,
        status: "Confirmed",
        paymentStatus: "AdvancePaid",
        specialInstructions: "कॉल मास्किंग टेस्ट बुकिंग",
      });
      console.log("✅ Created Confirmed test booking for user 9696559848 with ID:", existingBooking._id);
    } else {
      console.log("Existing Confirmed booking found for user 9696559848:", existingBooking._id);
    }
  }

  console.log("\n--- Pandit Details ---");
  console.log("Name:", pandit.fullName);
  console.log("Mobile:", pandit.mobileNumber);
  console.log("City:", pandit.city, ",", pandit.state);
  console.log("Status: Active");

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
