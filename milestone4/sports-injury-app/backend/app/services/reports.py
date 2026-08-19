"""
services/reports.py
----------------------
Generates the two exports the BRD's Reports & Export System module calls
for: a PDF risk assessment report, and an Excel training-load export.

Font note: fpdf2's built-in "core" fonts (Helvetica, Times, Courier) only
support Latin-1 -- they crash on anything outside that range, including an
ordinary em-dash, let alone an athlete's name with an accented character
(Jose, Francois, etc.), which is a completely realistic real-world input,
not an edge case worth hand-waving away. DejaVu Sans (bundled in
app/assets/fonts/, permissively licensed under the Bitstream Vera License)
is used instead so this doesn't depend on what fonts happen to be installed
on whatever machine this runs on -- verified by testing with an em-dash and
non-ASCII names during development, not just assumed to work.

Kept deliberately simple otherwise: these functions take plain Python data
(not SQLAlchemy model objects directly) so they're easy to unit test
without a database, and so the router stays the only place that knows
about the database at all.
"""

import io
import os
from datetime import datetime
from fpdf import FPDF
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill
from openpyxl.utils import get_column_letter

_FONT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets", "fonts")


def _new_pdf() -> FPDF:
    pdf = FPDF()
    pdf.add_font("DejaVu", "", os.path.join(_FONT_DIR, "DejaVuSans.ttf"))
    pdf.add_font("DejaVu", "B", os.path.join(_FONT_DIR, "DejaVuSans-Bold.ttf"))
    pdf.add_font("DejaVu", "I", os.path.join(_FONT_DIR, "DejaVuSans-Oblique.ttf"))
    return pdf


def generate_risk_assessment_pdf(athlete_name: str, sport_type: str, assessment: dict) -> bytes:
    """
    assessment is a plain dict with the same shape as RiskAssessmentOut:
    overall_score, risk_band, the five sub-scores, breakdown (list of
    strings), data_completeness_warnings (list of strings), computed_at.
    """
    pdf = _new_pdf()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)

    pdf.set_font("DejaVu", "B", 18)
    pdf.cell(0, 10, "Injury Risk Assessment Report", new_x="LMARGIN", new_y="NEXT")

    pdf.set_font("DejaVu", "", 11)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 6, f"{athlete_name} \u2014 {sport_type or 'Sport not set'}", new_x="LMARGIN", new_y="NEXT")
    computed_at = assessment.get("computed_at")
    computed_at_str = computed_at.strftime("%Y-%m-%d %H:%M") if isinstance(computed_at, datetime) else str(computed_at)
    pdf.cell(0, 6, f"Computed: {computed_at_str}", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    # Overall score, prominent
    pdf.set_text_color(0, 0, 0)
    pdf.set_font("DejaVu", "B", 36)
    pdf.cell(60, 16, str(assessment["overall_score"]), new_x="RIGHT")
    pdf.set_font("DejaVu", "B", 14)
    band = assessment["risk_band"]
    band_label = band.value.upper() if hasattr(band, "value") else str(band).upper()
    pdf.cell(0, 16, band_label, new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    # Disclaimer -- always present, never omitted from the export just
    # because it's a "final" document rather than the in-app view.
    pdf.set_font("DejaVu", "I", 9)
    pdf.set_text_color(120, 120, 120)
    pdf.multi_cell(
        0, 5,
        "This is a heuristic screening score based on published sports-science thresholds, "
        "not a diagnosis. It should be interpreted alongside clinical judgment, not in place of it.",
        new_x="LMARGIN", new_y="NEXT",
    )
    pdf.ln(4)
    pdf.set_text_color(0, 0, 0)

    # Sub-scores table
    pdf.set_font("DejaVu", "B", 12)
    pdf.cell(0, 8, "Category Breakdown", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("DejaVu", "", 10)
    categories = [
        ("Biomechanical Deviations (35%)", assessment.get("biomechanical_score")),
        ("Movement Asymmetry (20%)", assessment.get("asymmetry_score")),
        ("Historical Injury Factors (20%)", assessment.get("historical_injury_score")),
        ("Training Load (15%)", assessment.get("training_load_score")),
        ("Fatigue (10%)", assessment.get("fatigue_score")),
    ]
    for label, value in categories:
        display_value = str(value) if value is not None else "Insufficient data"
        pdf.cell(120, 7, label)
        pdf.cell(0, 7, display_value, new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    warnings = assessment.get("data_completeness_warnings") or []
    if warnings:
        pdf.set_font("DejaVu", "B", 11)
        pdf.set_text_color(180, 100, 0)
        pdf.cell(0, 7, "Data Completeness Warnings", new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("DejaVu", "", 9)
        # Explicit new_x/new_y on every multi_cell call, not just relying on
        # its defaults -- found the hard way: without this, the cursor's X
        # position can drift right after a run of multi_cell calls, and a
        # LATER multi_cell (the "Why This Score" section below) can end up
        # with almost no width left to wrap into, crashing with "Not enough
        # horizontal space to render a single character." Caught by the
        # automated test suite, not by manual testing -- the one hand-built
        # PDF checked during development happened not to trigger it.
        for w in warnings:
            pdf.multi_cell(0, 5, f"- {w}", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(2)
        pdf.set_text_color(0, 0, 0)

    breakdown = assessment.get("breakdown") or []
    if breakdown:
        pdf.set_font("DejaVu", "B", 12)
        pdf.cell(0, 8, "Why This Score", new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("DejaVu", "", 9)
        for line in breakdown:
            pdf.multi_cell(0, 5, f"- {line}", new_x="LMARGIN", new_y="NEXT")

    return bytes(pdf.output())


def generate_training_load_excel(athlete_name: str, entries: list[dict]) -> bytes:
    """
    entries: list of dicts with keys session_date, session_type,
    duration_minutes, intensity_rpe, notes (matching TrainingLoadEntryOut).
    """
    wb = Workbook()
    ws = wb.active
    ws.title = "Training Load"

    ws["A1"] = f"Training Load \u2014 {athlete_name}"
    ws["A1"].font = Font(bold=True, size=14)
    ws.merge_cells("A1:E1")

    headers = ["Date", "Session Type", "Duration (min)", "RPE", "Notes"]
    header_row = 3
    for col, header in enumerate(headers, start=1):
        cell = ws.cell(row=header_row, column=col, value=header)
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = PatternFill(start_color="4338CA", end_color="4338CA", fill_type="solid")

    for row_idx, entry in enumerate(sorted(entries, key=lambda e: e["session_date"]), start=header_row + 1):
        ws.cell(row=row_idx, column=1, value=str(entry["session_date"]))
        ws.cell(row=row_idx, column=2, value=entry["session_type"])
        ws.cell(row=row_idx, column=3, value=entry["duration_minutes"])
        ws.cell(row=row_idx, column=4, value=entry.get("intensity_rpe"))
        ws.cell(row=row_idx, column=5, value=entry.get("notes") or "")

    for col_idx, width in enumerate([14, 18, 16, 8, 40], start=1):
        ws.column_dimensions[get_column_letter(col_idx)].width = width

    buffer = io.BytesIO()
    wb.save(buffer)
    return buffer.getvalue()
