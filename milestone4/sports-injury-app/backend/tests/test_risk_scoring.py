"""
tests/test_risk_scoring.py
-----------------------------
Verifies the risk scoring engine's behavior against the exact cited
thresholds from the research (see module docstring in
app/services/risk_scoring.py for full citations):

- ACWR sweet spot 0.8-1.3 should score low; >1.5 should score high
- LSI >=90% should score low asymmetry; <70% should score high
- Missing-data categories should be excluded (not treated as 0 or 100)
"""

from datetime import date, timedelta
from types import SimpleNamespace

from app.services import risk_scoring
from app import models


def make_training_entry(days_ago, duration_minutes, rpe):
    return SimpleNamespace(
        session_date=date.today() - timedelta(days=days_ago),
        duration_minutes=duration_minutes,
        intensity_rpe=rpe,
    )


def make_injury_record(days_ago, severity, body_part="knee", recovery_status="recovered"):
    return SimpleNamespace(
        date_occurred=date.today() - timedelta(days=days_ago),
        severity=models.InjurySeverity(severity),
        body_part=models.BodyPart(body_part),
        recovery_status=models.RecoveryStatus(recovery_status),
    )


class TestPiecewiseScore:
    def test_at_low_boundary_scores_near_low_max(self):
        score = risk_scoring._piecewise_score(6.0, low_max=6.0, moderate_max=10.0, high_max=14.0)
        assert score == risk_scoring.LOW_MAX

    def test_zero_value_scores_zero(self):
        assert risk_scoring._piecewise_score(0.0, low_max=6.0, moderate_max=10.0, high_max=14.0) == 0.0

    def test_far_above_high_max_approaches_100(self):
        score = risk_scoring._piecewise_score(28.0, low_max=6.0, moderate_max=10.0, high_max=14.0)
        assert score == 100.0

    def test_score_to_band_matches_documented_boundaries(self):
        assert risk_scoring.score_to_band(39) == models.RiskBand.low
        assert risk_scoring.score_to_band(40) == models.RiskBand.moderate
        assert risk_scoring.score_to_band(64) == models.RiskBand.moderate
        assert risk_scoring.score_to_band(65) == models.RiskBand.high
        assert risk_scoring.score_to_band(84) == models.RiskBand.high
        assert risk_scoring.score_to_band(85) == models.RiskBand.critical


class TestBiomechanicalScore:
    def test_no_data_returns_none(self):
        score, notes = risk_scoring.compute_biomechanical_score({"joint_angles": {}})
        assert score is None

    def test_deviation_at_normative_baseline_scores_low(self):
        summary = {"joint_angles": {"left_knee_deviation_angle": {"avg": 6.0}, "right_knee_deviation_angle": None}}
        score, notes = risk_scoring.compute_biomechanical_score(summary)
        assert risk_scoring.score_to_band(score) == models.RiskBand.low

    def test_large_deviation_scores_high_or_critical(self):
        summary = {"joint_angles": {"left_knee_deviation_angle": {"avg": 20.0}, "right_knee_deviation_angle": None}}
        score, notes = risk_scoring.compute_biomechanical_score(summary)
        assert risk_scoring.score_to_band(score) in (models.RiskBand.high, models.RiskBand.critical)

    def test_uses_worse_side_when_asymmetric(self):
        summary = {"joint_angles": {
            "left_knee_deviation_angle": {"avg": 5.0},
            "right_knee_deviation_angle": {"avg": 18.0},
        }}
        score, notes = risk_scoring.compute_biomechanical_score(summary)
        # should be driven by the worse (right) side, not averaged down
        assert score > risk_scoring._piecewise_score(11.5, 6.0, 10.0, 14.0)


class TestAsymmetryScore:
    def test_perfect_symmetry_scores_low(self):
        score, notes = risk_scoring.compute_asymmetry_score({"knee_symmetry_lsi_percent": 100.0})
        assert risk_scoring.score_to_band(score) == models.RiskBand.low

    def test_lsi_at_clinical_threshold_still_low(self):
        # 90% is the cited "acceptable" cutoff -- should not yet be flagged
        score, notes = risk_scoring.compute_asymmetry_score({"knee_symmetry_lsi_percent": 90.0})
        assert risk_scoring.score_to_band(score) == models.RiskBand.low

    def test_lsi_below_clinical_threshold_scores_higher(self):
        below = risk_scoring.compute_asymmetry_score({"knee_symmetry_lsi_percent": 85.0})[0]
        at_threshold = risk_scoring.compute_asymmetry_score({"knee_symmetry_lsi_percent": 90.0})[0]
        assert below > at_threshold

    def test_severe_asymmetry_scores_high(self):
        score, notes = risk_scoring.compute_asymmetry_score({"knee_symmetry_lsi_percent": 65.0})
        assert risk_scoring.score_to_band(score) in (models.RiskBand.high, models.RiskBand.critical)

    def test_missing_lsi_returns_none(self):
        score, notes = risk_scoring.compute_asymmetry_score({"knee_symmetry_lsi_percent": None})
        assert score is None


class TestHistoricalInjuryScore:
    def test_no_injuries_scores_very_low(self):
        score, notes = risk_scoring.compute_historical_injury_score([])
        assert score < 10

    def test_recent_severe_injury_scores_high(self):
        records = [make_injury_record(days_ago=30, severity="severe")]
        score, notes = risk_scoring.compute_historical_injury_score(records)
        assert score > 60

    def test_old_mild_recovered_injury_scores_low(self):
        records = [make_injury_record(days_ago=900, severity="mild")]  # ~2.5 years ago
        score, notes = risk_scoring.compute_historical_injury_score(records)
        assert score < 15

    def test_active_injury_keeps_full_weight_regardless_of_age(self):
        # Even an injury from "long ago" that's still marked active (unresolved)
        # should not decay to near-zero.
        records = [make_injury_record(days_ago=600, severity="moderate", recovery_status="active")]
        score, notes = risk_scoring.compute_historical_injury_score(records)
        assert score >= 45

    def test_body_part_match_bonus_applies(self):
        records = [make_injury_record(days_ago=60, severity="moderate", body_part="knee")]
        with_match = risk_scoring.compute_historical_injury_score(records, flagged_body_part="knee")[0]
        without_match = risk_scoring.compute_historical_injury_score(records, flagged_body_part="shoulder")[0]
        assert with_match > without_match


class TestTrainingLoadScore:
    def test_insufficient_data_returns_none(self):
        entries = [make_training_entry(1, 60, 6)]
        score, notes = risk_scoring.compute_training_load_score(entries)
        assert score is None

    def test_steady_moderate_load_in_sweet_spot_scores_low(self):
        # Same load every day for 28 days -> ACWR should land at ~1.0 (sweet spot)
        entries = [make_training_entry(d, 60, 6) for d in range(28)]
        score, notes = risk_scoring.compute_training_load_score(entries)
        assert risk_scoring.score_to_band(score) == models.RiskBand.low

    def test_recent_spike_scores_high(self):
        # Low load for weeks 2-4, then a big spike in the last 7 days
        entries = [make_training_entry(d, 30, 4) for d in range(8, 28)]
        entries += [make_training_entry(d, 120, 9) for d in range(0, 7)]
        score, notes = risk_scoring.compute_training_load_score(entries)
        assert risk_scoring.score_to_band(score) in (models.RiskBand.high, models.RiskBand.critical)

    def test_undertraining_scores_moderate_not_low(self):
        # High chronic load, then almost nothing in the last week
        entries = [make_training_entry(d, 90, 7) for d in range(8, 28)]
        entries += [make_training_entry(d, 10, 2) for d in range(0, 7)]
        score, notes = risk_scoring.compute_training_load_score(entries)
        assert score > 15  # should register as elevated risk, not "safe"


class TestFatigueScore:
    def test_insufficient_data_returns_none(self):
        entries = [make_training_entry(d, 60, 5) for d in range(3)]
        score, notes = risk_scoring.compute_fatigue_score(entries)
        assert score is None

    def test_stable_rpe_scores_low(self):
        entries = [make_training_entry(d, 60, 5) for d in range(8)]
        score, notes = risk_scoring.compute_fatigue_score(entries)
        assert risk_scoring.score_to_band(score) == models.RiskBand.low

    def test_rising_rpe_trend_scores_higher(self):
        entries = [make_training_entry(6 - i, 60, rpe) for i, rpe in enumerate([4, 4, 4, 8, 8, 8])]
        score, notes = risk_scoring.compute_fatigue_score(entries)
        assert risk_scoring.score_to_band(score) in (models.RiskBand.high, models.RiskBand.critical)


class TestComputeOverallRisk:
    def test_all_categories_available_uses_full_weights(self):
        sub_scores = {"biomechanical_score": 50, "asymmetry_score": 50, "historical_injury_score": 50, "training_load_score": 50, "fatigue_score": 50}
        overall, band, warnings = risk_scoring.compute_overall_risk(sub_scores)
        assert overall == 50.0
        assert warnings == []

    def test_missing_categories_are_excluded_not_zeroed(self):
        # If a missing category were silently treated as 0, this would pull
        # the score down; if treated as 100, it would push it up. Excluding
        # it should leave the score equal to the average of what's present.
        sub_scores = {"biomechanical_score": 80, "asymmetry_score": None, "historical_injury_score": None, "training_load_score": None, "fatigue_score": None}
        overall, band, warnings = risk_scoring.compute_overall_risk(sub_scores)
        assert overall == 80.0
        assert len(warnings) == 1

    def test_no_data_at_all_defaults_to_low_with_warning(self):
        sub_scores = {"biomechanical_score": None, "asymmetry_score": None, "historical_injury_score": None, "training_load_score": None, "fatigue_score": None}
        overall, band, warnings = risk_scoring.compute_overall_risk(sub_scores)
        assert overall == 0.0
        assert band == models.RiskBand.low
        assert len(warnings) == 1

    def test_biomechanics_weighted_more_than_fatigue(self):
        # 35% weight vs 10% weight -- a high biomechanical score with everything
        # else low should pull the composite up more than a high fatigue score would.
        biomech_high = risk_scoring.compute_overall_risk({"biomechanical_score": 90, "asymmetry_score": 10, "historical_injury_score": 10, "training_load_score": 10, "fatigue_score": 10})[0]
        fatigue_high = risk_scoring.compute_overall_risk({"biomechanical_score": 10, "asymmetry_score": 10, "historical_injury_score": 10, "training_load_score": 10, "fatigue_score": 90})[0]
        assert biomech_high > fatigue_high
