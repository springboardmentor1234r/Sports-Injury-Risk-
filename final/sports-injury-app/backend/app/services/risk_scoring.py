"""
services/risk_scoring.py
---------------------------
Computes a composite injury-risk score for an athlete, combining the BRD's
five weighted categories:

    Biomechanical Deviations   35%
    Movement Asymmetry         20%
    Historical Injury Factors  20%
    Training Load Indicators   15%
    Fatigue Indicators         10%

DESIGN PRINCIPLE, stated once here rather than repeated everywhere: this is
a HEURISTIC, RULE-BASED score built on published, cited thresholds -- not a
trained machine learning model. No labeled injury-outcome dataset exists
anywhere in this system (nothing here has ever recorded "this movement
pattern was followed by a confirmed injury"), so a "trained model" would
either be fabricated or dangerously overfit to nothing. A transparent,
citable, inspectable formula is the honest choice, and it matches what the
sports-science literature review (done before writing this file) found
real injury-prediction systems actually rely on as their strongest,
best-supported signals.

THIS IS A SCREENING AID, NOT A DIAGNOSIS. Every score is returned with a
full breakdown of contributing factors and any data-quality warnings, so a
physiotherapist or sports scientist can see exactly why a number is what it
is, agree or disagree with it, and use their own clinical judgment. It
should never be presented to an athlete or coach as a medical verdict.

Citations behind every threshold used below:

- Acute:Chronic Workload Ratio (ACWR) "sweet spot" 0.8-1.3, elevated risk
  above ~1.5: Gabbett TJ, "The training-injury prevention paradox: should
  athletes be training smarter and harder?", Br J Sports Med, 2016; and the
  broader ACWR literature since. Actively debated methodologically -- used
  here as one contributing signal, never a standalone verdict.
- Limb Symmetry Index (LSI) 90% threshold: near-universal in ACL
  return-to-sport literature (multiple systematic reviews); originally a
  strength/hop-test metric, adapted here to movement-angle ROM symmetry.
- Frontal Plane Projection Angle (FPPA) knee-valgus proxy, normative
  baseline ~4.7 degrees (men) / ~7.3 degrees (women) during single-leg
  landing: Munro A, Herrington L, Comfort P, "The relationship between 2D
  knee valgus angle during single leg squat...", 2012, and related work.
  Described in that literature as having "weak to moderate" predictive
  validity -- treated accordingly here.
- Functional Movement Screen composite cutoff of 14/21: Kiesel K et al.,
  2007, and replications -- informed the overall banding philosophy
  (a single composite cutoff separating "flagged" from "not flagged")
  even though our score is built from a different set of underlying
  measurements.

Where this file goes beyond a specific cited number (e.g. the exact score
value assigned between 1.3 and 1.5 ACWR, or the knee-deviation angle bands
built on top of the ~6 degree normative baseline), that is this project's
own calibration on top of the cited reference points, not itself a
published absolute threshold -- flagged explicitly in each function's
docstring, not blurred together with the cited figures.
"""

from datetime import datetime, timedelta
from app import models


# ---------------------------------------------------------------------------
# Shared scoring scale
# ---------------------------------------------------------------------------
# Every sub-score and the overall composite share one 0-100 scale with the
# same band boundaries, so a person reading "72" in any category knows it
# means "High" everywhere in the app, not a different scale per metric.
LOW_MAX = 39
MODERATE_MAX = 64
HIGH_MAX = 84


def score_to_band(score: float) -> models.RiskBand:
    if score <= LOW_MAX:
        return models.RiskBand.low
    if score <= MODERATE_MAX:
        return models.RiskBand.moderate
    if score <= HIGH_MAX:
        return models.RiskBand.high
    return models.RiskBand.critical


def _piecewise_score(value: float, low_max: float, moderate_max: float, high_max: float) -> float:
    """
    Maps a raw metric value (where HIGHER is RISKIER) onto the shared 0-100
    scale, given three boundary points in the metric's own units. Callers
    with an inverted metric (e.g. LSI percentage, where LOWER is riskier)
    should transform it into a "deviation from safe" value first.
    """
    if low_max <= 0:
        low_max = 0.0001  # guard against divide-by-zero while keeping the shape
    if value <= low_max:
        return round((value / low_max) * LOW_MAX, 1)
    elif value <= moderate_max:
        return round(40 + (value - low_max) / (moderate_max - low_max) * (MODERATE_MAX - 40), 1)
    elif value <= high_max:
        return round(65 + (value - moderate_max) / (high_max - moderate_max) * (HIGH_MAX - 65), 1)
    else:
        overflow = min((value - high_max) / high_max, 1.0) if high_max > 0 else 1.0
        return round(85 + overflow * 15, 1)


# ---------------------------------------------------------------------------
# 1. Biomechanical Deviations -- 35%
# ---------------------------------------------------------------------------

def compute_biomechanical_score(analysis_summary: dict) -> tuple[float | None, list[str]]:
    """
    Takes a video's analysis summary (as returned by
    biomechanics.summarize_video) and scores knee deviation (valgus proxy)
    against the cited ~4.7-7.3 degree normative baseline.

    Calibration note (this project's own, not a published cutoff): we use
    6 degrees (roughly the midpoint of the cited male/female normative
    range) as the "expected" baseline, and treat roughly double that as
    approaching the "high" band -- inspired by, not identical to, the ~8
    degree injured-vs-uninjured differential reported in Hewett et al. 2005.
    """
    notes = []
    joint_angles = analysis_summary.get("joint_angles", {}) if analysis_summary else {}

    left_dev = joint_angles.get("left_knee_deviation_angle")
    right_dev = joint_angles.get("right_knee_deviation_angle")

    dev_values = [v["avg"] for v in (left_dev, right_dev) if v is not None]
    if not dev_values:
        return None, ["No knee deviation (valgus proxy) data available -- knee/hip/ankle were not confidently visible in the analyzed video."]

    worst_deviation = max(dev_values)
    score = _piecewise_score(worst_deviation, low_max=6.0, moderate_max=10.0, high_max=14.0)
    notes.append(
        f"Knee deviation (valgus proxy) angle of {worst_deviation:.1f}\u00b0 "
        f"(reference baseline ~6\u00b0) contributes a biomechanical score of {score}."
    )
    notes.append(
        "This metric assumes a roughly front-facing camera angle -- if the video was filmed "
        "from the side, this figure is not meaningful."
    )
    return score, notes


# ---------------------------------------------------------------------------
# 2. Movement Asymmetry -- 20%
# ---------------------------------------------------------------------------

def compute_asymmetry_score(analysis_summary: dict) -> tuple[float | None, list[str]]:
    """
    Applies the clinical 90% Limb Symmetry Index threshold directly to our
    knee ROM symmetry measurement.
    """
    if not analysis_summary:
        return None, ["No video analysis available for asymmetry scoring."]

    lsi = analysis_summary.get("knee_symmetry_lsi_percent")
    if lsi is None:
        return None, ["Could not compute Limb Symmetry Index -- one or both knees were not confidently tracked."]

    deviation_from_perfect = max(0.0, 100 - lsi)
    # LSI >= 90% (deviation <= 10) is the cited "acceptable" threshold.
    score = _piecewise_score(deviation_from_perfect, low_max=10.0, moderate_max=20.0, high_max=30.0)
    notes = [f"Knee Limb Symmetry Index of {lsi}% (clinical threshold: \u226590% is considered acceptable) contributes an asymmetry score of {score}."]
    return score, notes


# ---------------------------------------------------------------------------
# 3. Historical Injury Factors -- 20%
# ---------------------------------------------------------------------------

_SEVERITY_WEIGHT = {
    models.InjurySeverity.mild: 20,
    models.InjurySeverity.moderate: 50,
    models.InjurySeverity.severe: 80,
}


def compute_historical_injury_score(injury_records: list, flagged_body_part: str | None = None) -> tuple[float | None, list[str]]:
    """
    Recency-weighted injury history: a severe injury 2 months ago should
    weigh far more heavily than the same injury 3 years ago. Injuries whose
    recovery_status is still "active" keep full weight regardless of how
    long ago they started, since they represent an unresolved issue.

    If any recent (within 12 months) injury shares a body part with what
    the biomechanical analysis flagged (currently: "knee", when the
    biomechanical score above is elevated), an additional bonus is applied
    -- an old knee injury plus a new knee valgus signal compounds risk in a
    way that two unrelated flags don't.

    This weighting scheme (the specific decay curve and bonus amount) is
    this project's own design, not itself drawn from a single published
    formula -- recency-weighting injury history is a well-established
    general principle in the literature, but no single canonical formula
    for it exists to cite directly.
    """
    if not injury_records:
        return 5.0, ["No injury history on file -- baseline low score."]

    now = datetime.utcnow().date()
    contributions = []
    notes = []

    for record in injury_records:
        severity_weight = _SEVERITY_WEIGHT.get(record.severity, 30)

        if record.recovery_status == models.RecoveryStatus.active:
            recency_weight = 1.0
        else:
            months_since = max(0, (now - record.date_occurred).days / 30.44)
            recency_weight = max(0.0, 1 - months_since / 24)  # linear decay over 24 months

        contribution = severity_weight * recency_weight
        contributions.append(contribution)

        if recency_weight > 0.3 or record.recovery_status == models.RecoveryStatus.active:
            notes.append(
                f"{record.severity.value.title()} {record.body_part.value.replace('_', ' ')} injury "
                f"({record.date_occurred.isoformat()}, {record.recovery_status.value}) contributes to historical risk."
            )

        if (
            flagged_body_part
            and record.body_part.value == flagged_body_part
            and (now - record.date_occurred).days <= 365
        ):
            contributions.append(15)
            notes.append(
                f"Bonus: recent {record.body_part.value} injury history compounds with a current "
                f"biomechanical flag on the same body part."
            )

    score = min(100.0, round(sum(contributions), 1))
    if not notes:
        notes.append("Injury history on file, but old enough / mild enough to contribute minimally.")
    return score, notes


# ---------------------------------------------------------------------------
# 4. Training Load Indicators -- 15%
# ---------------------------------------------------------------------------

def compute_training_load_score(training_load_entries: list) -> tuple[float | None, list[str]]:
    """
    Computes session-RPE-based Acute:Chronic Workload Ratio (ACWR):
    acute load = average daily load over the last 7 days
    chronic load = average daily load over the last 28 days
    ACWR = acute / chronic

    Banded directly against the cited literature zones (Gabbett 2016 and
    the broader ACWR literature), rather than smoothly interpolated --
    the literature itself frames these as zones, not a continuous curve,
    and banding avoids implying more precision than the evidence supports.
    """
    if not training_load_entries:
        return None, ["No training load entries on file -- cannot compute Acute:Chronic Workload Ratio."]

    now = datetime.utcnow().date()
    acute_cutoff = now - timedelta(days=7)
    chronic_cutoff = now - timedelta(days=28)

    def session_load(entry):
        return entry.duration_minutes * (entry.intensity_rpe or 5)  # 5 = neutral assumption if RPE wasn't logged

    acute_entries = [e for e in training_load_entries if e.session_date >= acute_cutoff]
    chronic_entries = [e for e in training_load_entries if e.session_date >= chronic_cutoff]

    if len(chronic_entries) < 4:
        return None, [f"Only {len(chronic_entries)} training session(s) logged in the last 28 days -- not enough data for a reliable Acute:Chronic Workload Ratio (need at least 4)."]

    acute_load = sum(session_load(e) for e in acute_entries) / 7
    chronic_load = sum(session_load(e) for e in chronic_entries) / 28

    if chronic_load == 0:
        return None, ["Chronic training load is zero -- cannot compute a workload ratio."]

    acwr = round(acute_load / chronic_load, 2)

    if acwr < 0.8:
        score = 35.0
        band_note = "below the 0.8-1.3 sweet spot (undertraining / detraining risk)"
    elif acwr <= 1.3:
        score = 10.0
        band_note = "within the cited 0.8-1.3 'sweet spot'"
    elif acwr <= 1.5:
        score = 55.0
        band_note = "above the 1.3 sweet-spot ceiling, approaching the cited elevated-risk zone"
    elif acwr <= 2.0:
        score = 80.0
        band_note = "in the cited elevated-injury-risk zone (>1.5)"
    else:
        score = 95.0
        band_note = "far above the cited elevated-injury-risk zone (>2.0)"

    notes = [f"Acute:Chronic Workload Ratio of {acwr} is {band_note}."]
    return score, notes


# ---------------------------------------------------------------------------
# 5. Fatigue Indicators -- 10%
# ---------------------------------------------------------------------------

def compute_fatigue_score(training_load_entries: list) -> tuple[float | None, list[str]]:
    """
    Compares average self-reported RPE of the most recent sessions against
    the sessions before that. A meaningfully rising RPE trend for
    similar training suggests accumulating fatigue that hasn't been matched
    by recovery. This is the most honest fatigue signal available from data
    this system actually collects -- no wearable/HRV/sleep data exists here
    to build a richer fatigue model from.
    """
    rated_entries = sorted(
        [e for e in training_load_entries if e.intensity_rpe is not None],
        key=lambda e: e.session_date,
    )
    if len(rated_entries) < 6:
        return None, [f"Only {len(rated_entries)} RPE-rated session(s) logged -- not enough data for a fatigue trend (need at least 6)."]

    recent = rated_entries[-3:]
    prior = rated_entries[-6:-3]
    recent_avg = sum(e.intensity_rpe for e in recent) / len(recent)
    prior_avg = sum(e.intensity_rpe for e in prior) / len(prior)
    delta = round(recent_avg - prior_avg, 2)

    if delta <= 0:
        score = 15.0
    elif delta <= 1:
        score = 35.0
    elif delta <= 2:
        score = 60.0
    else:
        score = 85.0

    notes = [f"Average RPE moved from {prior_avg:.1f} to {recent_avg:.1f} over recent sessions (change of {delta:+.1f})."]
    return score, notes


# ---------------------------------------------------------------------------
# Composite
# ---------------------------------------------------------------------------

_WEIGHTS = {
    "biomechanical_score": 0.35,
    "asymmetry_score": 0.20,
    "historical_injury_score": 0.20,
    "training_load_score": 0.15,
    "fatigue_score": 0.10,
}


def compute_overall_risk(sub_scores: dict) -> tuple[float, models.RiskBand, list[str]]:
    """
    Combines sub-scores into the overall 0-100 composite. If a category is
    missing (None -- insufficient data, not zero risk), its weight is
    proportionally redistributed among the categories that ARE available,
    and a warning is added -- treating missing data as "unknown" rather
    than silently assuming it's safe (which "counting it as 0" would do)
    or silently assuming it's dangerous (which "counting it as 100" would do).
    """
    available = {k: v for k, v in sub_scores.items() if v is not None}
    warnings = []

    if not available:
        return 0.0, models.RiskBand.low, ["No data available in any category -- score defaults to 0 (Low) but is not meaningful. Log injury history, training sessions, and/or upload a video to get a real assessment."]

    available_weight_total = sum(_WEIGHTS[k] for k in available)
    missing = set(_WEIGHTS) - set(available)
    if missing:
        warnings.append(
            f"{len(missing)} of 5 risk categories had insufficient data ({', '.join(m.replace('_score', '').replace('_', ' ') for m in missing)}) "
            f"and were excluded -- this score is based on partial data."
        )

    overall = sum(sub_scores[k] * (_WEIGHTS[k] / available_weight_total) for k in available)
    overall = round(min(100.0, max(0.0, overall)), 1)
    return overall, score_to_band(overall), warnings
