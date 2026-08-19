"""initial schema: users, athlete_profiles, injury_records, performance_metrics, physical_assessments, training_load_entries

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-07-16
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


user_role_enum = postgresql.ENUM(
    "athlete", "coach", "physiotherapist", "sports_scientist", "admin",
    name="userrole", create_type=False,
)
injury_severity_enum = postgresql.ENUM("mild", "moderate", "severe", name="injuryseverity", create_type=False)
recovery_status_enum = postgresql.ENUM("active", "recovering", "recovered", name="recoverystatus", create_type=False)
body_part_enum = postgresql.ENUM(
    "knee", "ankle", "hamstring", "shoulder", "lower_back", "hip", "calf", "groin", "other",
    name="bodypart", create_type=False,
)


def upgrade() -> None:
    bind = op.get_bind()
    user_role_enum.create(bind, checkfirst=True)
    injury_severity_enum.create(bind, checkfirst=True)
    recovery_status_enum.create(bind, checkfirst=True)
    body_part_enum.create(bind, checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("full_name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("role", user_role_enum, nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "athlete_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False, unique=True),
        sa.Column("sport_type", sa.String(), nullable=True),
        sa.Column("position", sa.String(), nullable=True),
        sa.Column("age", sa.Integer(), nullable=True),
        sa.Column("height_cm", sa.Float(), nullable=True),
        sa.Column("weight_kg", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )

    op.create_table(
        "injury_records",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("athlete_profile_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("athlete_profiles.id"), nullable=False),
        sa.Column("body_part", body_part_enum, nullable=False),
        sa.Column("injury_type", sa.String(), nullable=False),
        sa.Column("severity", injury_severity_enum, nullable=False),
        sa.Column("recovery_status", recovery_status_enum, nullable=False),
        sa.Column("date_occurred", sa.Date(), nullable=False),
        sa.Column("expected_recovery_date", sa.Date(), nullable=True),
        sa.Column("actual_recovery_date", sa.Date(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("recorded_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_injury_records_athlete_profile_id", "injury_records", ["athlete_profile_id"])

    op.create_table(
        "performance_metrics",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("athlete_profile_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("athlete_profiles.id"), nullable=False),
        sa.Column("metric_name", sa.String(), nullable=False),
        sa.Column("metric_value", sa.Float(), nullable=False),
        sa.Column("unit", sa.String(), nullable=False),
        sa.Column("recorded_date", sa.Date(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("recorded_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_performance_metrics_athlete_profile_id", "performance_metrics", ["athlete_profile_id"])

    op.create_table(
        "physical_assessments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("athlete_profile_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("athlete_profiles.id"), nullable=False),
        sa.Column("assessment_type", sa.String(), nullable=False),
        sa.Column("assessment_date", sa.Date(), nullable=False),
        sa.Column("findings", sa.Text(), nullable=True),
        sa.Column("recommendations", sa.Text(), nullable=True),
        sa.Column("follow_up_required", sa.Boolean(), nullable=True),
        sa.Column("assessor_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_physical_assessments_athlete_profile_id", "physical_assessments", ["athlete_profile_id"])

    op.create_table(
        "training_load_entries",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("athlete_profile_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("athlete_profiles.id"), nullable=False),
        sa.Column("session_date", sa.Date(), nullable=False),
        sa.Column("session_type", sa.String(), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), nullable=False),
        sa.Column("intensity_rpe", sa.Integer(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("recorded_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_training_load_entries_athlete_profile_id", "training_load_entries", ["athlete_profile_id"])


def downgrade() -> None:
    op.drop_table("training_load_entries")
    op.drop_table("physical_assessments")
    op.drop_table("performance_metrics")
    op.drop_table("injury_records")
    op.drop_table("athlete_profiles")
    op.drop_table("users")

    bind = op.get_bind()
    body_part_enum.drop(bind, checkfirst=True)
    recovery_status_enum.drop(bind, checkfirst=True)
    injury_severity_enum.drop(bind, checkfirst=True)
    user_role_enum.drop(bind, checkfirst=True)
