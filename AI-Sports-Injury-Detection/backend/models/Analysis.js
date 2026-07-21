const mongoose = require("mongoose");

const analysisSchema = new mongoose.Schema(
{
    athlete: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Athlete",
        required: true
    },

    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
        required: true
    },

    riskScore: {
        type: Number,
        default: 0
    },

    movementScore: {
        type: Number,
        default: 0
    },

    movementQuality: {
        type: String,
        default: "Unknown"
    },

    mlPrediction: {
        type: String,
        default: "Unknown"
    },

    runningPhase: {
        type: String,
        default: "Unknown"
    },

    symmetry: {
        knee: String,
        elbow: String
    },

    recommendations: [
        {
            type: String
        }
    ],

    reportJson: String,

    reportTxt: String,

    graphImage: String,

    processedVideo: String,

    status: {
        type: String,
        enum: ["Processing", "Completed", "Failed"],
        default: "Processing"
    }

},
{
    timestamps: true
});

module.exports = mongoose.model("Analysis", analysisSchema);