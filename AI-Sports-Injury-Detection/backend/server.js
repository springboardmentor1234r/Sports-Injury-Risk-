const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db.js");
const authRoutes = require("./routes/authRoutes.js");
const athleteRoutes=require("./routes/athleteRoutes.js");
const videoRoutes=require("./routes/videoRoutes");

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/athletes",athleteRoutes);
app.use("/api/videos",videoRoutes);



app.get("/", (req, res) => {
    res.send("Hello Gayathri! My backend is working");
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});