// MongoDB Schema Definitions

const poseLandmarksSchema = {
  video_id: String,
  frame_number: Number,
  timestamp: Number,
  landmarks: [{
    id: Number,
    name: String,
    x: Number,
    y: Number,
    z: Number,
    visibility: Number,
    confidence: Number
  }],
  skeleton_connections: [[Number, Number]]
};

const temporalPosesSchema = {
  video_id: String,
  athlete_id: String,
  pose_sequence: [poseLandmarksSchema],
  metadata: {
    fps: Number,
    duration: Number,
    resolution: String
  }
};

const featureVectorsSchema = {
  analysis_id: String,
  features: Object,
  normalized_features: Object
};
