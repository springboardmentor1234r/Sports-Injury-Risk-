// BlazePose landmark indexes used to calculate the angle at each joint.
const JOINT_LANDMARKS = {
  leftElbow: [11, 13, 15], // left shoulder, elbow, wrist
  rightElbow: [12, 14, 16], // right shoulder, elbow, wrist
  leftKnee: [23, 25, 27], // left hip, knee, ankle
  rightKnee: [24, 26, 28], // right hip, knee, ankle
};

const isFinitePoint = (point) => (
  point
  && Number.isFinite(Number(point.x))
  && Number.isFinite(Number(point.y))
  && Number.isFinite(Number(point.z ?? 0))
);

/**
 * Calculates the angle (in degrees) at `vertex` formed by three 3D pose landmarks.
 * Returns null when a landmark is unavailable or either limb has zero length.
 */
const calculateAngle = (firstPoint, vertex, thirdPoint) => {
  if (![firstPoint, vertex, thirdPoint].every(isFinitePoint)) return null;

  const firstVector = {
    x: Number(firstPoint.x) - Number(vertex.x),
    y: Number(firstPoint.y) - Number(vertex.y),
    z: Number(firstPoint.z ?? 0) - Number(vertex.z ?? 0),
  };
  const thirdVector = {
    x: Number(thirdPoint.x) - Number(vertex.x),
    y: Number(thirdPoint.y) - Number(vertex.y),
    z: Number(thirdPoint.z ?? 0) - Number(vertex.z ?? 0),
  };

  const firstMagnitude = Math.hypot(firstVector.x, firstVector.y, firstVector.z);
  const thirdMagnitude = Math.hypot(thirdVector.x, thirdVector.y, thirdVector.z);
  if (firstMagnitude === 0 || thirdMagnitude === 0) return null;

  const dotProduct = (
    firstVector.x * thirdVector.x
    + firstVector.y * thirdVector.y
    + firstVector.z * thirdVector.z
  );
  // Floating-point rounding can produce values slightly outside [-1, 1].
  const cosine = Math.max(-1, Math.min(1, dotProduct / (firstMagnitude * thirdMagnitude)));

  return (Math.acos(cosine) * 180) / Math.PI;
};

/**
 * Calculates the supported BlazePose joint angles from a 33-landmark pose.
 */
const calculateJointAngles = (landmarks) => {
  if (!Array.isArray(landmarks)) {
    return Object.fromEntries(Object.keys(JOINT_LANDMARKS).map((joint) => [joint, null]));
  }

  return Object.fromEntries(
    Object.entries(JOINT_LANDMARKS).map(([joint, indexes]) => (
      [joint, calculateAngle(landmarks[indexes[0]], landmarks[indexes[1]], landmarks[indexes[2]])]
    )),
  );
};

export { calculateAngle, calculateJointAngles, JOINT_LANDMARKS };
export default calculateJointAngles;
