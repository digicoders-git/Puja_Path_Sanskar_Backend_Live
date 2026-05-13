const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected");

        // Fix Pandit emailId index issue if it exists
        try {
            const Pandit = require("../models/Pandit");
            
            // Clean up existing null or empty emailId values
            await Pandit.updateMany(
                { $or: [{ emailId: null }, { emailId: "" }] },
                { $unset: { emailId: 1 } }
            );
            console.log("Cleaned up null/empty emailId values");

            await Pandit.collection.dropIndex("emailId_1");
            console.log("Pandit emailId index dropped for recreation");
        } catch (err) {
            // Index might not exist or already be correct, ignore error
        }
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};

module.exports = connectDB;