const express = require("express");

const router = express.Router();

const {
    saveAnalysis,
    getAnalysisByAthlete,
    getAllAnalyses,
    deleteAnalysis
} = require("../controllers/analysisController");

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// Save AI Analysis
router.post(
    "/",
    authMiddleware,
    authorizeRoles("coach", "admin", "physiotherapist", "sports_scientist", "athlete"),
    saveAnalysis
);

// Get all analyses
router.get(
    "/",
    authMiddleware,
    authorizeRoles("coach", "admin", "physiotherapist", "sports_scientist", "athlete"),
    getAllAnalyses
);

// Get all analyses of one athlete
router.get(
    "/:athleteId",
    authMiddleware,
    authorizeRoles("coach", "admin", "physiotherapist", "sports_scientist", "athlete"),
    getAnalysisByAthlete
);

// Delete analysis report
router.delete(
    "/:id",
    authMiddleware,
    authorizeRoles("coach", "admin", "physiotherapist", "sports_scientist", "athlete"),
    deleteAnalysis
);

module.exports = router;