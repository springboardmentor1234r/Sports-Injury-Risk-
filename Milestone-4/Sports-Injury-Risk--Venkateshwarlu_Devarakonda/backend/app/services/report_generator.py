from io import BytesIO
from html import escape

from reportlab.lib.colors import darkblue
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
)


def safe_text(value, default="--"):
    """
    Safely convert a value to text for ReportLab.
    """

    if value is None:
        return default

    return escape(str(value))


def generate_report(video):
    """
    Generate PDF report using the analysis already
    stored in the database.

    IMPORTANT:
    We do NOT run pose estimation again.
    """

    analysis = (
        video.analysis
        if isinstance(video.analysis, dict)
        else {}
    )

    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40,
    )

    styles = getSampleStyleSheet()

    title_style = styles["Heading1"]
    title_style.textColor = darkblue

    story = []


    # =====================================================
    # TITLE
    # =====================================================

    story.append(
        Paragraph(
            "Sports Injury Risk Detection Report",
            title_style,
        )
    )

    story.append(
        Spacer(1, 20)
    )


    # =====================================================
    # VIDEO INFORMATION
    # =====================================================

    story.append(
        Paragraph(
            f"<b>Video Name:</b> "
            f"{safe_text(video.filename)}",
            styles["Normal"],
        )
    )

    story.append(
        Paragraph(
            f"<b>Video ID:</b> "
            f"{safe_text(video.id)}",
            styles["Normal"],
        )
    )

    story.append(
        Paragraph(
            f"<b>Uploaded At:</b> "
            f"{safe_text(video.uploaded_at)}",
            styles["Normal"],
        )
    )

    story.append(
        Spacer(1, 20)
    )


    # =====================================================
    # POSE SUMMARY
    # =====================================================

    story.append(
        Paragraph(
            "Pose Summary",
            styles["Heading2"],
        )
    )

    story.append(
        Paragraph(
            f"Frames: "
            f"{safe_text(analysis.get('frames'))}",
            styles["Normal"],
        )
    )

    story.append(
        Paragraph(
            f"Pose Detected: "
            f"{safe_text(analysis.get('pose_detected'))}",
            styles["Normal"],
        )
    )

    story.append(
        Paragraph(
            f"Success Rate: "
            f"{safe_text(analysis.get('success_rate'))} %",
            styles["Normal"],
        )
    )

    story.append(
        Spacer(1, 20)
    )


    # =====================================================
    # JOINT ANGLES
    # =====================================================

    story.append(
        Paragraph(
            "Joint Angles",
            styles["Heading2"],
        )
    )

    joints = analysis.get(
        "joint_angles",
        {},
    )

    if isinstance(joints, dict) and joints:

        for joint, angle in joints.items():

            story.append(
                Paragraph(
                    f"{safe_text(joint).replace('_', ' ').title()} : "
                    f"{safe_text(angle)}°",
                    styles["Normal"],
                )
            )

    else:

        story.append(
            Paragraph(
                "No joint angle data available.",
                styles["Normal"],
            )
        )

    story.append(
        Spacer(1, 20)
    )


    # =====================================================
    # RISK ANALYSIS
    # =====================================================

    story.append(
        Paragraph(
            "Risk Analysis",
            styles["Heading2"],
        )
    )

    risk = analysis.get(
        "risk_analysis",
        {},
    )

    if not isinstance(risk, dict):
        risk = {}


    story.append(
        Paragraph(
            f"Risk Score: "
            f"{safe_text(risk.get('risk_score'))}",
            styles["Normal"],
        )
    )

    story.append(
        Paragraph(
            f"Risk Level: "
            f"{safe_text(risk.get('risk_level'))}",
            styles["Normal"],
        )
    )


    story.append(
        Paragraph(
            "Remarks",
            styles["Heading3"],
        )
    )

    remarks = risk.get(
        "remarks",
        [],
    )

    if isinstance(remarks, list) and remarks:

        for remark in remarks:

            story.append(
                Paragraph(
                    f"• {safe_text(remark)}",
                    styles["Normal"],
                )
            )

    else:

        story.append(
            Paragraph(
                "No risk remarks available.",
                styles["Normal"],
            )
        )

    story.append(
        Spacer(1, 20)
    )


    # =====================================================
    # BIOMECHANICS
    # =====================================================

    story.append(
        Paragraph(
            "Biomechanics Analysis",
            styles["Heading2"],
        )
    )

    bio = analysis.get(
        "biomechanics",
        {},
    )

    if not isinstance(bio, dict):
        bio = {}


    # ---------------- RANGE OF MOTION ----------------

    range_of_motion = bio.get(
        "range_of_motion",
        {},
    )

    if not isinstance(
        range_of_motion,
        dict,
    ):
        range_of_motion = {}


    story.append(
        Paragraph(
            f"Average ROM: "
            f"{safe_text(range_of_motion.get('average_rom'))}°",
            styles["Normal"],
        )
    )

    story.append(
        Paragraph(
            f"ROM Status: "
            f"{safe_text(range_of_motion.get('status'))}",
            styles["Normal"],
        )
    )


    # ---------------- MOVEMENT SYMMETRY ----------------

    movement_symmetry = bio.get(
        "movement_symmetry",
        {},
    )

    if not isinstance(
        movement_symmetry,
        dict,
    ):
        movement_symmetry = {}


    story.append(
        Paragraph(
            f"Movement Symmetry: "
            f"{safe_text(movement_symmetry.get('symmetry_score'))} %",
            styles["Normal"],
        )
    )

    story.append(
        Paragraph(
            f"Symmetry Difference: "
            f"{safe_text(movement_symmetry.get('difference'))}",
            styles["Normal"],
        )
    )


    # ---------------- HIP STABILITY ----------------

    hip_stability = bio.get(
        "hip_stability",
        {},
    )

    if not isinstance(
        hip_stability,
        dict,
    ):
        hip_stability = {}


    story.append(
        Paragraph(
            f"Hip Stability: "
            f"{safe_text(hip_stability.get('status'))}",
            styles["Normal"],
        )
    )

    story.append(
        Paragraph(
            f"Hip Difference: "
            f"{safe_text(hip_stability.get('difference'))}",
            styles["Normal"],
        )
    )


    # ---------------- OTHER METRICS ----------------

    story.append(
        Paragraph(
            f"Balance Score: "
            f"{safe_text(bio.get('balance_score'))}",
            styles["Normal"],
        )
    )

    story.append(
        Paragraph(
            f"Joint Alignment: "
            f"{safe_text(bio.get('joint_alignment'))}",
            styles["Normal"],
        )
    )

    story.append(
        Paragraph(
            f"Movement Quality: "
            f"{safe_text(bio.get('movement_quality'))} %",
            styles["Normal"],
        )
    )

    story.append(
        Spacer(1, 20)
    )


    # =====================================================
    # INJURY PREDICTION
    # =====================================================

    injury_prediction = analysis.get(
        "injury_prediction",
        {},
    )

    if isinstance(
        injury_prediction,
        dict,
    ):

        injury_risks = injury_prediction.get(
            "injury_risks",
            [],
        )

        if isinstance(
            injury_risks,
            list
        ) and injury_risks:

            story.append(
                Paragraph(
                    "Injury Prediction",
                    styles["Heading2"],
                )
            )

            for injury in injury_risks:

                if not isinstance(
                    injury,
                    dict,
                ):
                    continue

                injury_name = injury.get(
                    "injury",
                    "Unknown",
                )

                risk_score = injury.get(
                    "risk_score",
                    "--",
                )

                story.append(
                    Paragraph(
                        f"<b>{safe_text(injury_name)}</b> : "
                        f"{safe_text(risk_score)} %",
                        styles["Normal"],
                    )
                )

            story.append(
                Spacer(1, 20)
            )


    # =====================================================
    # RECOMMENDATIONS
    # =====================================================

    recommendations_data = analysis.get(
        "recommendations",
        {},
    )

    recommendations = []

    if isinstance(
        recommendations_data,
        dict,
    ):

        recommendations = recommendations_data.get(
            "recommendations",
            [],
        )


    if isinstance(
        recommendations,
        list
    ) and recommendations:

        story.append(
            Paragraph(
                "Recommendations",
                styles["Heading2"],
            )
        )

        for item in recommendations:

            if isinstance(
                item,
                dict,
            ):

                text = item.get(
                    "recommendation",
                    item.get(
                        "text",
                        "",
                    ),
                )

            else:

                text = str(item)


            if text:

                story.append(
                    Paragraph(
                        f"• {safe_text(text)}",
                        styles["Normal"],
                    )
                )

        story.append(
            Spacer(1, 20)
        )


    # =====================================================
    # FOOTER
    # =====================================================

    story.append(
        Spacer(1, 20)
    )

    story.append(
        Paragraph(
            "Generated automatically by Sports Injury Risk Detection System",
            styles["Italic"],
        )
    )


    # =====================================================
    # BUILD PDF
    # =====================================================

    doc.build(story)

    buffer.seek(0)

    return buffer