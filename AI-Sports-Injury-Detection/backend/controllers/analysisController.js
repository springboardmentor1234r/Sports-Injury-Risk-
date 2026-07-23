const Analysis = require("../models/Analysis");

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

module.exports = {
    saveAnalysis,
    getAnalysisByAthlete
};