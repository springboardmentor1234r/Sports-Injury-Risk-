from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image,
    HRFlowable,
)

from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.enums import TA_CENTER
from datetime import datetime
import os


def generate_pdf_report(
    filename,
    thumbnail_path,
    video_info,
    joint_angles,
    movement_analysis,
    injury_risk,
    injury_prediction,
    movement_anomalies,
    risk_score,
    recommendations,
):

    pdf_name = filename.rsplit(".", 1)[0] + "_report.pdf"
    pdf_path = os.path.join("uploads", pdf_name)

    doc = SimpleDocTemplate(
        pdf_path,
        rightMargin=30,
        leftMargin=30,
        topMargin=25,
        bottomMargin=25,
    )

    styles = getSampleStyleSheet()

    story = []

    # =====================================================
    # HEADER
    # =====================================================

    header = Table(
        [
            ["SPORTS INJURY RISK DETECTION"],
            ["AI PERFORMANCE ANALYSIS REPORT"],
        ],
        colWidths=[520],
    )

    header.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#0F4C81")),
        ("TEXTCOLOR", (0, 0), (-1, -1), colors.white),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, 1), (-1, 1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, 0), 20),
        ("FONTSIZE", (0, 1), (-1, 1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
    ]))

    story.append(header)
    story.append(Spacer(1, 15))

    report_id = "SIRD-" + datetime.now().strftime("%Y%m%d-%H%M%S")

    story.append(
        Paragraph(
            f"<b>Report ID:</b> {report_id}",
            styles["Normal"],
        )
    )

    story.append(
        Paragraph(
            f"<b>Generated:</b> {datetime.now().strftime('%d %B %Y, %I:%M %p')}",
            styles["Normal"],
        )
    )

    story.append(Spacer(1, 15))

    # =====================================================
    # VIDEO PREVIEW
    # =====================================================

    if thumbnail_path and os.path.exists(thumbnail_path):

        story.append(
            Paragraph(
                "<b>🎥 Video Preview</b>",
                styles["Heading2"],
            )
        )

        img = Image(thumbnail_path)

        img.drawWidth = 300
        img.drawHeight = 170

        image_table = Table([[img]], colWidths=[520])

        image_table.setStyle(TableStyle([
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ]))

        story.append(image_table)
        story.append(Spacer(1, 15))

    # =====================================================
    # RISK SUMMARY
    # =====================================================

    risk_level = risk_score.get("risk_level", "Unknown")
    overall_score = risk_score.get("overall_score", "N/A")

    if risk_level.lower() == "low":
        risk_color = colors.green
    elif risk_level.lower() == "medium":
        risk_color = colors.orange
    else:
        risk_color = colors.red

    story.append(
        Paragraph(
            "<b>📊 Risk Summary</b>",
            styles["Heading2"],
        )
    )

    summary_table = Table([
        ["Metric", "Result"],
        ["Risk Level", risk_level],
        ["Risk Score", str(overall_score)],
        ["Movement Quality", movement_analysis],
    ], colWidths=[220, 300])

    summary_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), risk_color),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("BACKGROUND", (0, 1), (-1, -1), colors.whitesmoke),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
    ]))

    story.append(summary_table)
    story.append(Spacer(1, 20))

    story.append(HRFlowable(width="100%", thickness=1))
    story.append(Spacer(1, 15))

# =====================================================
# VIDEO INFORMATION
# =====================================================

    story.append(
        Paragraph(
            "<b>🎥 Video Information</b>",
            styles["Heading2"],
        )
    )

    video_data = [
        ["Property", "Value"],
        ["Filename", filename],
        ["Resolution", f"{video_info.get('width',0)} × {video_info.get('height',0)}"],
        ["FPS", str(video_info.get("fps",0))],
        ["Duration", f"{video_info.get('duration_seconds',0):.2f} sec"],
        ["Total Frames", str(video_info.get("total_frames",0))]
    ]

    video_table = Table(video_data, colWidths=[180, 340])

    video_table.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,0),colors.HexColor("#1E3A8A")),
        ("TEXTCOLOR",(0,0),(-1,0),colors.white),
        ("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),
        ("FONTSIZE",(0,0),(-1,0),12),
        ("GRID",(0,0),(-1,-1),0.5,colors.grey),
        ("BACKGROUND",(0,1),(-1,-1),colors.whitesmoke),
        ("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.whitesmoke, colors.beige]),
        ("BOTTOMPADDING",(0,0),(-1,-1),8),
        ("TOPPADDING",(0,0),(-1,-1),8),
    ]))

    story.append(video_table)
    story.append(Spacer(1,18))


    # =====================================================
    # JOINT ANGLES
    # =====================================================

    story.append(
        Paragraph(
            "<b>📐 Joint Angles</b>",
            styles["Heading2"],
        )
    )

    angle_data = [["Joint","Angle (°)"]]

    for joint, angle in joint_angles.items():

        angle_data.append([
            joint.replace("_"," ").title(),
            f"{angle:.2f}" if isinstance(angle,(int,float)) else str(angle)
        ])

    angle_table = Table(angle_data, colWidths=[250,270])

    angle_table.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,0),colors.HexColor("#2563EB")),
        ("TEXTCOLOR",(0,0),(-1,0),colors.white),
        ("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),
        ("GRID",(0,0),(-1,-1),0.5,colors.grey),
        ("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.white, colors.HexColor("#F8FAFC")]),
        ("BOTTOMPADDING",(0,0),(-1,-1),8),
        ("TOPPADDING",(0,0),(-1,-1),8),
    ]))

    story.append(angle_table)
    story.append(Spacer(1,18))


    # =====================================================
    # DETAILED RISK ANALYSIS
    # =====================================================

    story.append(
        Paragraph(
            "<b>📊 Detailed Risk Analysis</b>",
            styles["Heading2"],
        )
    )

    risk_table = Table([
        ["Metric","Result"],
        ["Movement Quality", movement_analysis],
        ["Overall Injury Risk", injury_risk],
        ["Overall Score", str(risk_score.get("overall_score","N/A"))],
        ["Risk Level", risk_level],
    ], colWidths=[250,270])

    risk_table.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,0),risk_color),
        ("TEXTCOLOR",(0,0),(-1,0),colors.white),
        ("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),
        ("GRID",(0,0),(-1,-1),0.5,colors.grey),
        ("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.whitesmoke, colors.beige]),
        ("BOTTOMPADDING",(0,0),(-1,-1),8),
        ("TOPPADDING",(0,0),(-1,-1),8),
    ]))

    story.append(risk_table)
    story.append(Spacer(1,18))


    # =====================================================
    # INJURY PREDICTION
    # =====================================================

    story.append(
        Paragraph(
            "<b>🚑 Injury Prediction</b>",
            styles["Heading2"],
        )
    )

    prediction_data = [["Predicted Injury","Risk"]]

    for injury, value in injury_prediction.items():

        prediction_data.append([
            injury.replace("_"," ").title(),
            value,
        ])

    prediction_table = Table(prediction_data, colWidths=[280,240])

    prediction_table.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,0),colors.HexColor("#F97316")),
        ("TEXTCOLOR",(0,0),(-1,0),colors.white),
        ("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),
        ("GRID",(0,0),(-1,-1),0.5,colors.grey),
        ("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.white, colors.HexColor("#FFF7ED")]),
        ("BOTTOMPADDING",(0,0),(-1,-1),8),
        ("TOPPADDING",(0,0),(-1,-1),8),
    ]))

    story.append(prediction_table)
    story.append(Spacer(1,18))


    # =====================================================
    # MOVEMENT ANOMALIES
    # =====================================================

    story.append(
        Paragraph(
            "<b>⚠ Movement Anomalies</b>",
            styles["Heading2"],
        )
    )

    if movement_anomalies:

        anomaly_rows = [["Joint","Severity","Issue"]]

        for anomaly in movement_anomalies:

            anomaly_rows.append([
                anomaly.get("joint","Unknown"),
                anomaly.get("severity","N/A"),
                anomaly.get("issue","N/A"),
            ])

        anomaly_table = Table(anomaly_rows, colWidths=[150,120,250])

        anomaly_table.setStyle(TableStyle([
            ("BACKGROUND",(0,0),(-1,0),colors.red),
            ("TEXTCOLOR",(0,0),(-1,0),colors.white),
            ("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),
            ("GRID",(0,0),(-1,-1),0.5,colors.grey),
            ("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.whitesmoke, colors.beige]),
            ("BOTTOMPADDING",(0,0),(-1,-1),8),
            ("TOPPADDING",(0,0),(-1,-1),8),
        ]))

        story.append(anomaly_table)

        story.append(Spacer(1,10))

        story.append(
            Paragraph(
                "<b>Recommendations for Detected Anomalies</b>",
                styles["Heading3"],
            )
        )

        for anomaly in movement_anomalies:

            story.append(
                Paragraph(
                    f"• <b>{anomaly.get('joint')}</b>: {anomaly.get('recommendation','No recommendation available.')}",
                    styles["BodyText"],
                )
            )

    else:

        story.append(
            Paragraph(
                "✅ No movement anomalies detected.",
                styles["BodyText"],
            )
        )

    story.append(Spacer(1,18))


    # =====================================================
    # AI RECOMMENDATIONS
    # =====================================================

    story.append(
        Paragraph(
            "<b>💡 AI Recommendations</b>",
            styles["Heading2"],
        )
    )

    if recommendations:

        for rec in recommendations:

            story.append(
                Paragraph(
                    f"✔ {rec}",
                    styles["BodyText"],
                )
            )

    else:

        story.append(
            Paragraph(
                "No recommendations available.",
                styles["BodyText"],
            )
        )

    story.append(Spacer(1,25))

    # =====================================================
    # FOOTER
    # =====================================================

    story.append(Spacer(1, 10))

    story.append(
        HRFlowable(
            width="100%",
            thickness=1.2,
            color=colors.HexColor("#0F4C81"),
        )
    )

    story.append(Spacer(1, 10))

    footer_table = Table(
        [
            ["SPORTS INJURY RISK DETECTION"],
            ["AI Performance Analysis System"],
            ["Infosys Springboard Internship Project"],
            ["Department of Computer Science & Engineering"],
            [f"Generated on {datetime.now().strftime('%d %B %Y, %I:%M:%S %p')}"],
        ],
        colWidths=[520],
    )

    footer_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0F4C81")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, 0), (-1, 0), 12),
            ("FONTSIZE", (0, 1), (-1, -1), 9),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#0F4C81")),
        ])
    )

    story.append(footer_table)

    story.append(Spacer(1, 8))

    story.append(
        Paragraph(
            "<para alignment='center'><font size='8' color='grey'>"
            "This report is automatically generated using AI-based movement analysis. "
            "Results are intended for screening and performance evaluation only and "
            "should not replace professional medical diagnosis."
            "</font></para>",
            styles["BodyText"],
        )
    )

    story.append(Spacer(1, 5))

    story.append(
        Paragraph(
            "<para alignment='center'><font size='8' color='#0F4C81'>"
            "© 2026 Sports Injury Risk Detection AI | All Rights Reserved"
            "</font></para>",
            styles["BodyText"],
        )
    )

    # =====================================================
    # BUILD PDF
    # =====================================================

    doc.build(story)

    return pdf_path