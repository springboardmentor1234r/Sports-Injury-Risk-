import mongoose from 'mongoose';

const analysisHistorySchema = new mongoose.Schema(
  {
    athleteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Athlete',
      required: true,
      index: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    videoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video',
      required: true,
    },
    video: {
      originalFileName: { type: String, required: true },
      storedFileName: { type: String, required: true },
      filePath: { type: String, required: true },
      mimeType: { type: String, default: '' },
      fileSize: { type: Number, required: true },
      uploadedAt: { type: Date, required: true },
    },
    // This immutable snapshot is the exact JSON object returned by POST /api/ai/pose.
    rawResponse: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    // Indexed copies are read directly from rawResponse and are never recalculated.
    riskLevel: { type: String, required: true, index: true },
    riskScore: { type: Number, required: true },
    frameCount: { type: Number, required: true },
    reportGeneratedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

analysisHistorySchema.index({ uploadedBy: 1, createdAt: -1 });
analysisHistorySchema.index({ athleteId: 1, createdAt: -1 });
analysisHistorySchema.index({ uploadedBy: 1, riskLevel: 1, createdAt: -1 });
analysisHistorySchema.index({ 'video.originalFileName': 'text' });

const AnalysisHistory = mongoose.model('AnalysisHistory', analysisHistorySchema);

export default AnalysisHistory;

