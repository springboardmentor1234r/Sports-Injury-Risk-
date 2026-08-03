const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db.js");
const authRoutes = require("./routes/authRoutes.js");
const athleteRoutes=require("./routes/athleteRoutes.js");
const videoRoutes=require("./routes/videoRoutes");
const analysisRoutes = require("./routes/analysisRoutes");

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors({ origin: ["http://localhost:5173", "http://127.0.0.1:5173"] }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/athletes",athleteRoutes);
app.use("/api/videos",videoRoutes);
app.use("/api/analysis", analysisRoutes);



app.get("/", (req, res) => {
    res.send("Hello Gayathri! My backend is working");
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});