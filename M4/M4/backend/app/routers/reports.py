import csv
from io import BytesIO, StringIO

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from sqlalchemy.orm import Session

from .. import auth, models
from ..database import get_db
from .videos import ensure_access, get_analysis_or_404

router = APIRouter(prefix="/reports", tags=["Reports & Export"])


def checked_analysis(analysis_id: int, user: models.User, db: Session) -> models.VideoAnalysis:
    analysis = get_analysis_or_404(analysis_id, db)
    ensure_access(analysis, user)
    if not analysis.result:
        raise HTTPException(status_code=409, detail="Report is available once analysis completes")
    return analysis


@router.get("/analysis/{analysis_id}/csv")
def csv_report(analysis_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    analysis = checked_analysis(analysis_id, current_user, db)
    result = analysis.result
    stream = StringIO()
    writer = csv.writer(stream)
    writer.writerow(["KineticGuard movement assessment"])
    writer.writerow(["Athlete", analysis.athlete.user.full_name])
    writer.writerow(["Activity", analysis.activity])
    writer.writerow(["Overall risk", result.overall_risk])
    writer.writerow(["Risk level", result.risk_level])
    writer.writerow([])
    writer.writerow(["Metric", "Value"])
    for key, value in result.metrics.items():
        writer.writerow([key.replace("_", " ").title(), value])
    writer.writerow([])
    writer.writerow(["Potential injury", "Probability"])
    for key, value in result.injury_probabilities.items():
        writer.writerow([key.replace("_", " ").title(), f"{value}%"])
    name = f"kineticguard-analysis-{analysis.id}.csv"
    return Response(stream.getvalue(), media_type="text/csv", headers={"Content-Disposition": f'attachment; filename="{name}"'})


@router.get("/analysis/{analysis_id}/pdf")
def pdf_report(analysis_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    analysis = checked_analysis(analysis_id, current_user, db)
    result = analysis.result
    buffer = BytesIO()
    styles = getSampleStyleSheet()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=42, leftMargin=42, topMargin=42, bottomMargin=42)
    story = [Paragraph("KineticGuard Movement Assessment", styles["Title"]), Spacer(1, 10), Paragraph(f"<b>Athlete:</b> {analysis.athlete.user.full_name}<br/><b>Activity:</b> {analysis.activity.title()}<br/><b>Assessment ID:</b> KG-{analysis.id:05d}", styles["BodyText"]), Spacer(1, 14)]
    overview = [["Overall risk", f"{result.overall_risk}/100 ({result.risk_level.title()})"], ["Movement quality", f"{result.movement_quality_score}/100"], ["Biomechanical efficiency", f"{result.biomechanical_score}/100"], ["Symmetry", f"{result.symmetry_score}%"], ["Fatigue indicator", f"{result.fatigue_score}/100"]]
    metrics = [["Biomechanical metric", "Value"]] + [[key.replace("_", " ").title(), str(value)] for key, value in result.metrics.items() if key != "analysis_method"]
    for title, data in (("Assessment overview", overview), ("Biomechanical metrics", metrics)):
        story += [Paragraph(title, styles["Heading2"]), Table(data, colWidths=[2.5 * inch, 3.0 * inch], style=TableStyle([("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E8EEFF")), ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#CAD3F4")), ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7)])), Spacer(1, 14)]
    story += [Paragraph("Key findings", styles["Heading2"])] + [Paragraph(f"• {finding}", styles["BodyText"]) for finding in result.findings] + [Spacer(1, 12), Paragraph("Recommended next steps", styles["Heading2"])]
    story += [Paragraph(f"<b>{item['title']}:</b> {item['detail']}", styles["BodyText"]) for item in result.recommendations]
    story += [Spacer(1, 15), Paragraph("This automated screening supports training and clinical decisions; it is not a medical diagnosis.", styles["Italic"])]
    doc.build(story)
    name = f"kineticguard-analysis-{analysis.id}.pdf"
    return Response(buffer.getvalue(), media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="{name}"'})
