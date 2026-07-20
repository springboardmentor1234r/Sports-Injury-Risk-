// BlazePose's fixed 33-landmark ordering, exposed as readable API labels.
const LANDMARK_NAMES = [
  'Nose', 'Left Eye Inner', 'Left Eye', 'Left Eye Outer', 'Right Eye Inner',
  'Right Eye', 'Right Eye Outer', 'Left Ear', 'Right Ear', 'Mouth Left',
  'Mouth Right', 'Left Shoulder', 'Right Shoulder', 'Left Elbow', 'Right Elbow',
  'Left Wrist', 'Right Wrist', 'Left Pinky', 'Right Pinky', 'Left Index',
  'Right Index', 'Left Thumb', 'Right Thumb', 'Left Hip', 'Right Hip',
  'Left Knee', 'Right Knee', 'Left Ankle', 'Right Ankle', 'Left Heel',
  'Right Heel', 'Left Foot Index', 'Right Foot Index',
];

/**
 * Serializes BlazePose landmarks with readable names while retaining the index for compatibility.
 */
const serializePoseLandmarks = (landmarks, width, height) => {
  if (!landmarks || !Array.isArray(landmarks)) {
    return [];
  }

  return landmarks.map((landmark, index) => ({
    landmarkIndex: index,
    landmarkName: LANDMARK_NAMES[index] ?? `Landmark ${index}`,
    x: Number(landmark?.x ?? 0),
    y: Number(landmark?.y ?? 0),
    z: Number(landmark?.z ?? 0),
    visibility: Number(landmark?.visibility ?? 0),
    width: Number(width || 0),
    height: Number(height || 0),
  }));
};

export { LANDMARK_NAMES };
export default serializePoseLandmarks;
