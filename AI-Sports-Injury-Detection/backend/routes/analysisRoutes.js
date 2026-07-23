const express = require("express");

const router = express.Router();

const {
    saveAnalysis,
    getAnalysisByAthlete
} = require("../controllers/analysisController");

const authMiddleware = require("../middleware/authMiddleware");

// Save AI Analysis
router.post(
    "/",
    authMiddleware,
    saveAnalysis
);

// Get all analyses of one athlete
router.get(
    "/:athleteId",
    authMiddleware,
    getAnalysisByAthlete
);

module.exports = router;