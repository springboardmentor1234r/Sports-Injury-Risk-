import os

# Configurable Thresholds for Biomechanical Analysis
# Angles are in degrees, ratios are in float percentages

THRESHOLD_NORMAL_KNEE_VALGUS = float(os.getenv("BIOMECH_NORMAL_KNEE_VALGUS", "10.0"))  # Max valgus angle deviation in degrees
THRESHOLD_NORMAL_KNEE_FLEXION_ROM = float(os.getenv("BIOMECH_NORMAL_KNEE_FLEXION_ROM", "120.0"))  # Target flexion ROM in degrees
THRESHOLD_NORMAL_HIP_STABILITY = float(os.getenv("BIOMECH_NORMAL_HIP_STABILITY", "5.0"))  # Max hip tilt/wobble in degrees
THRESHOLD_NORMAL_TRUNK_LEAN = float(os.getenv("BIOMECH_NORMAL_TRUNK_LEAN", "15.0"))  # Max forward/lateral lean in degrees
THRESHOLD_NORMAL_BALANCE_DEVIATION = float(os.getenv("BIOMECH_NORMAL_BALANCE_DEVIATION", "0.08"))  # CoM offset limit (normalized)
THRESHOLD_NORMAL_SYMMETRY_RATIO = float(os.getenv("BIOMECH_NORMAL_SYMMETRY_RATIO", "90.0"))  # Min symmetry percentage between left/right limbs
THRESHOLD_NORMAL_LANDING_ANGLE = float(os.getenv("BIOMECH_NORMAL_LANDING_ANGLE", "30.0"))  # Target knee flexion angle at landing impact
THRESHOLD_NORMAL_STRIDE_LENGTH = float(os.getenv("BIOMECH_NORMAL_STRIDE_LENGTH", "0.60"))  # Normal stride length range (normalized)

CONFIG_THRESHOLDS = {
    "knee_valgus": THRESHOLD_NORMAL_KNEE_VALGUS,
    "knee_flexion_rom": THRESHOLD_NORMAL_KNEE_FLEXION_ROM,
    "hip_stability": THROW_IF_NONE_HIP_STABILITY := THRESHOLD_NORMAL_HIP_STABILITY,
    "trunk_lean": THRESHOLD_NORMAL_TRUNK_LEAN,
    "balance_deviation": THRESHOLD_NORMAL_BALANCE_DEVIATION,
    "symmetry_ratio": THRESHOLD_NORMAL_SYMMETRY_RATIO,
    "landing_angle": THRESHOLD_NORMAL_LANDING_ANGLE,
    "stride_length": THRESHOLD_NORMAL_STRIDE_LENGTH
}
