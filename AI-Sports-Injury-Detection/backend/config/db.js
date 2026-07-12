
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = async () => {
    if (!process.env.MONGO_URI) {
        console.error("MONGO_URI is missing. Add your Atlas connection string to backend/.env");
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("Database connection failed.");
        console.error("Please verify that:");
        console.error("1. the Atlas cluster hostname is correct");
        console.error("2. your current IP is whitelisted in Atlas Network Access");
        console.error("3. the database username and password are correct");
        console.error(error.message);
        process.exit(1);
    }
};

module.exports = connectDB;