const serializePoseLandmarks = (landmarks, width, height) => {
  if (!landmarks || !Array.isArray(landmarks)) {
    return [];
  }

  return landmarks.map((landmark, index) => ({
    landmarkIndex: index,
    x: Number(landmark?.x ?? 0),
    y: Number(landmark?.y ?? 0),
    z: Number(landmark?.z ?? 0),
    visibility: Number(landmark?.visibility ?? 0),
    width: Number(width || 0),
    height: Number(height || 0),
  }));
};

export default serializePoseLandmarks;
