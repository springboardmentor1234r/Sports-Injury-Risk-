const Analysis = require("../models/Analysis");
const User = require("../models/User");
const Athlete = require("../models/Athlete");

const saveAnalysis = async (req, res) => {
    try {

        const analysis = await Analysis.create(req.body);

        return res.status(201).json({
            success: true,
            message: "Analysis saved successfully",
            analysis
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to save analysis"
        });

    }
};

const getAnalysisByAthlete = async (req, res) => {

    try {
        const currentUser = await User.findById(req.user.id);
        if (currentUser && currentUser.role === "athlete") {
            const targetAthlete = await Athlete.findById(req.params.athleteId);
            if (!targetAthlete || targetAthlete.name !== currentUser.name) {
                return res.status(403).json({
                    success: false,
                    message: "Access Denied: You can only view your own analysis reports"
                });
            }
        }

        const analyses = await Analysis.find({
            athlete: req.params.athleteId
        })
        .populate("athlete")
        .populate("video")
        .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            analyses
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch analysis"
        });

    }

};
const getAllAnalyses = async (req, res) => {
    try {
        let query = {};
        const currentUser = await User.findById(req.user.id);
        if (currentUser && currentUser.role === "athlete") {
            const matchingAthletes = await Athlete.find({ name: { $regex: new RegExp("^" + currentUser.name + "$", "i") } });
            const athleteIds = matchingAthletes.map(a => a._id);
            query.athlete = { $in: athleteIds };
        }

        const analyses = await Analysis.find(query)
            .populate("athlete")
            .populate("video")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            analyses
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch analyses"
        });
    }
};

const deleteAnalysis = async (req, res) => {
    try {
        const analysis = await Analysis.findById(req.params.id).populate("athlete");
        if (!analysis) {
            return res.status(404).json({
                success: false,
                message: "Analysis report not found"
            });
        }

        const currentUser = await User.findById(req.user.id);
        if (currentUser && currentUser.role === "athlete") {
            if (!analysis.athlete || analysis.athlete.name !== currentUser.name) {
                return res.status(403).json({
                    success: false,
                    message: "Access Denied: You can only delete your own analysis reports"
                });
            }
        }

        await Analysis.findByIdAndDelete(req.params.id);
        return res.status(200).json({
            success: true,
            message: "Analysis report deleted successfully"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete analysis report"
        });
    }
};

module.exports = {
    saveAnalysis,
    getAnalysisByAthlete,
    getAllAnalyses,
    deleteAnalysis
};