from io import BytesIO

from reportlab.lib.colors import darkblue
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
)

from app.services.pose_estimation import analyze_pose


def generate_report(video):
    """
    Generate PDF report for a video.
    """

    # -----------------------------------------
    # Run pose analysis again using saved video
    # -----------------------------------------

    analysis = analyze_pose(
    video.filepath,
    generate_video=False
)

    buffer = BytesIO()

    doc = SimpleDocTemplate(buffer)

    styles = getSampleStyleSheet()

    story = []

    title_style = styles["Heading1"]
    title_style.textColor = darkblue

    # -----------------------------------------
    # Title
    # -----------------------------------------

    story.append(
        Paragraph(
            "Sports Injury Risk Detection Report",
            title_style
        )
    )

    story.append(Spacer(1, 20))

    story.append(
        Paragraph(
            f"<b>Video Name:</b> {video.filename}",
            styles["Normal"]
        )
    )

    story.append(
        Paragraph(
            f"<b>Uploaded At:</b> {video.uploaded_at}",
            styles["Normal"]
        )
    )

    story.append(Spacer(1, 20))

    # -----------------------------------------
    # Pose Summary
    # -----------------------------------------

    story.append(
        Paragraph(
            "Pose Summary",
            styles["Heading2"]
        )
    )

    story.append(
        Paragraph(
            f"Frames : {analysis['frames']}",
            styles["Normal"]
        )
    )

    story.append(
        Paragraph(
            f"Pose Detected : {analysis['pose_detected']}",
            styles["Normal"]
        )
    )

    story.append(
        Paragraph(
            f"Success Rate : {analysis['success_rate']} %",
            styles["Normal"]
        )
    )

    story.append(Spacer(1, 20))

    # -----------------------------------------
    # Joint Angles
    # -----------------------------------------

    story.append(
        Paragraph(
            "Joint Angles",
            styles["Heading2"]
        )
    )

    joints = analysis["joint_angles"]

    for joint, angle in joints.items():

        story.append(
            Paragraph(
                f"{joint.replace('_', ' ').title()} : {angle}°",
                styles["Normal"]
            )
        )

    story.append(Spacer(1, 20))

    # -----------------------------------------
    # Risk Analysis
    # -----------------------------------------

    story.append(
        Paragraph(
            "Risk Analysis",
            styles["Heading2"]
        )
    )

    risk = analysis["risk_analysis"]

    story.append(
        Paragraph(
            f"Risk Score : {risk['risk_score']}",
            styles["Normal"]
        )
    )

    story.append(
        Paragraph(
            f"Risk Level : {risk['risk_level']}",
            styles["Normal"]
        )
    )

    story.append(
        Paragraph(
            "Remarks",
            styles["Heading3"]
        )
    )

    for remark in risk["remarks"]:

        story.append(
            Paragraph(
                f"• {remark}",
                styles["Normal"]
            )
        )

    story.append(Spacer(1, 20))

    # -----------------------------------------
    # Biomechanics
    # -----------------------------------------

    bio = analysis["biomechanics"]

    story.append(
        Paragraph(
            "Biomechanics Analysis",
            styles["Heading2"]
        )
    )

    story.append(
        Paragraph(
            f"Average ROM : {bio['range_of_motion']['average_rom']}°",
            styles["Normal"]
        )
    )

    story.append(
        Paragraph(
            f"ROM Status : {bio['range_of_motion']['status']}",
            styles["Normal"]
        )
    )

    story.append(
        Paragraph(
            f"Movement Symmetry : {bio['movement_symmetry']['symmetry_score']} %",
            styles["Normal"]
        )
    )

    story.append(
        Paragraph(
            f"Symmetry Difference : {bio['movement_symmetry']['difference']}",
            styles["Normal"]
        )
    )

    story.append(
        Paragraph(
            f"Hip Stability : {bio['hip_stability']['status']}",
            styles["Normal"]
        )
    )

    story.append(
        Paragraph(
            f"Hip Difference : {bio['hip_stability']['difference']}",
            styles["Normal"]
        )
    )

    story.append(
        Paragraph(
            f"Balance Score : {bio['balance_score']}",
            styles["Normal"]
        )
    )

    story.append(
        Paragraph(
            f"Joint Alignment : {bio['joint_alignment']}",
            styles["Normal"]
        )
    )

    story.append(
        Paragraph(
            f"Movement Quality : {bio['movement_quality']} %",
            styles["Normal"]
        )
    )

    story.append(Spacer(1, 20))

    # -----------------------------------------
    # Footer
    # -----------------------------------------

    story.append(
        Paragraph(
            "Generated Automatically by Sports Injury Risk Detection System",
            styles["Italic"]
        )
    )

    # -----------------------------------------
    # Build PDF
    # -----------------------------------------

    doc.build(story)

    buffer.seek(0)

    return buffer