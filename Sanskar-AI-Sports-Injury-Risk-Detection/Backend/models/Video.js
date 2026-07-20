import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema(
  {
    athleteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Athlete',
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    originalFileName: {
      type: String,
      required: true,
      trim: true,
    },
    storedFileName: {
      type: String,
      required: true,
      trim: true,
    },
    filePath: {
      type: String,
      required: true,
      trim: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
    processingStatus: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

const Video = mongoose.model('Video', videoSchema);

export default Video;
