

import argparse
import sys

# Import colors for terminal output
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    GREEN = '\033[92m'    # Low Risk
    YELLOW = '\033[93m'   # Moderate Risk
    ORANGE = '\033[38;5;208m' # High Risk
    RED = '\033[91m'      # Critical Risk
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def get_risk_color(risk_category):
    cat = risk_category.lower()
    if "low" in cat:
        return Colors.GREEN
    elif "moderate" in cat:
        return Colors.YELLOW
    elif "high" in cat:
        return Colors.ORANGE
    elif "critical" in cat:
        return Colors.RED
    return Colors.ENDC

def main():
    parser = argparse.ArgumentParser(description="Run the full Sports Injury Risk pipeline.")
    parser.add_argument(
        "--video_name", required=False,
        help="Base name of the video (e.g. 'sports')"
    )
    args = parser.parse_args()

    video_name = args.video_name
    if not video_name:
        from pose_extractor import choose_input_source_interactively, extract_landmarks_from_video, save_to_csv
        import os
        
        print(f"{Colors.BLUE}No video_name provided. Launching full pipeline from the beginning...{Colors.ENDC}")
        print(f"\n{Colors.BLUE}Step 1: Running Pose Extractor...{Colors.ENDC}")
        source, is_webcam = choose_input_source_interactively()
        frames_data = extract_landmarks_from_video(source, is_webcam=is_webcam, save_annotated_video=True)
        save_to_csv(frames_data, source, is_webcam=is_webcam)
        video_name = "webcam_session" if is_webcam else os.path.splitext(os.path.basename(source))[0]

    print(f"\n{Colors.BLUE}Step 2: Running Biomechanics Analyzer...{Colors.ENDC}")
    from biomechanics_analyzer import run_biomechanics_only
    run_biomechanics_only(video_name)

    print(f"\n{Colors.BLUE}Step 3: Running Risk Scoring Engine...{Colors.ENDC}")
    # Import and run risk scoring silently
    from risk_scoring_engine import run_risk_scoring
    risk_df = run_risk_scoring(video_name, quiet=True)
    if risk_df.empty:
        print("Error: Risk scoring failed to produce data.")
        sys.exit(1)
    
    risk_data = risk_df.iloc[0].to_dict()

    print(f"{Colors.BLUE}Step 4: Running Recommendation Engine (LLM Analysis)...{Colors.ENDC}")
    # Import and run recommendation engine
    from recommendation_engine import build_graph, RecommendationState
    
    app = build_graph()
    initial_state: RecommendationState = {
        "video_name": video_name,
        "risk_data": {},
        "flagged_issues": [],
        "categorized_issues": {},
        "recommended_exercises": {},
        "structured_summary": {},
        "output_path": "",
    }
    
    final_state = app.invoke(initial_state)
    summary = final_state.get("structured_summary", {})

    # ==========================================
    # DISPLAY FINAL DASHBOARD
    # ==========================================
    print("\n\n" + "=" * 80)
    print(f"{Colors.BOLD}{Colors.HEADER}1. HEADLINE SUMMARY{Colors.ENDC}")
    print("=" * 80)
    health_score = risk_data.get("overall_health_score", 0)
    risk_cat = risk_data.get("risk_category", "Unknown")
    color = get_risk_color(risk_cat)
    
    print(f"{Colors.BOLD}Overall Athlete Health Score : {health_score:.1f}/100{Colors.ENDC}")
    print(f"{Colors.BOLD}Risk Category                : {color}{risk_cat}{Colors.ENDC}")
    print(f"\n{summary.get('one_line_summary', 'No summary generated.')}")

    print("\n" + "=" * 80)
    print(f"{Colors.BOLD}{Colors.HEADER}2. SUPPORTING SCORES{Colors.ENDC}")
    print("=" * 80)
    print(f"Injury Risk Score            : {risk_data.get('final_risk_score', 0):.1f}/100")
    print(f"Movement Quality Score       : {risk_data.get('movement_quality_score', 0):.1f}/100")
    print(f"Biomechanical Efficiency     : {risk_data.get('biomechanical_efficiency_score', 0):.1f}/100")
    print(f"Fatigue Score                : {risk_data.get('fatigue_score', 0):.1f}/100")

    categories = summary.get("categories", [])
    
    print("\n" + "=" * 80)
    print(f"{Colors.BOLD}{Colors.HEADER}3. DETECTED ISSUES{Colors.ENDC}")
    print("=" * 80)
    if not categories:
        print("No significant movement issues detected.")
    else:
        for cat in categories:
            print(f"- {cat.get('issue_translation', '')}")

    print()
    # ==========================================
    # SAVE TO TXT FILE
    # ==========================================
    dashboard_text = []
    dashboard_text.append("=" * 80)
    dashboard_text.append("1. HEADLINE SUMMARY")
    dashboard_text.append("=" * 80)
    dashboard_text.append(f"Overall Athlete Health Score : {health_score:.1f}/100")
    dashboard_text.append(f"Risk Category                : {risk_cat}")
    dashboard_text.append(f"\n{summary.get('one_line_summary', 'No summary generated.')}")

    dashboard_text.append("\n" + "=" * 80)
    dashboard_text.append("2. SUPPORTING SCORES")
    dashboard_text.append("=" * 80)
    dashboard_text.append(f"Injury Risk Score            : {risk_data.get('final_risk_score', 0):.1f}/100")
    dashboard_text.append(f"Movement Quality Score       : {risk_data.get('movement_quality_score', 0):.1f}/100")
    dashboard_text.append(f"Biomechanical Efficiency     : {risk_data.get('biomechanical_efficiency_score', 0):.1f}/100")
    dashboard_text.append(f"Fatigue Score                : {risk_data.get('fatigue_score', 0):.1f}/100")

    dashboard_text.append("\n" + "=" * 80)
    dashboard_text.append("3. DETECTED ISSUES")
    dashboard_text.append("=" * 80)
    if not categories:
        dashboard_text.append("No significant movement issues detected.")
    else:
        for cat in categories:
            dashboard_text.append(f"- {cat.get('issue_translation', '')}")

    dashboard_text.append("\n" + "=" * 80)
    dashboard_text.append("4. RECOMMENDATIONS")
    dashboard_text.append("=" * 80)
    if not categories:
        dashboard_text.append("Keep up the good work! Maintain general strength and mobility.")
    else:
        for cat in categories:
            cat_name = cat.get("category_name", "").replace("_", " ").title()
            dashboard_text.append(f"Category: {cat_name}")
            dashboard_text.append(f"What this means: {cat.get('explanation', '')}")
            dashboard_text.append("Recommended Exercises:")
            for ex in cat.get("recommended_exercises", []):
                dashboard_text.append(f"  • {ex}")
            dashboard_text.append("")

    dashboard_text.append("=" * 80)
    dashboard_text.append("5. OVERALL SUMMARY")
    dashboard_text.append("=" * 80)
    dashboard_text.append(summary.get("wrap_up_summary", ""))

    dashboard_text.append("\n" + "-" * 80)
    dashboard_text.append("Disclaimer: This is an AI-assisted movement screening tool based on video pose "
          "estimation and rule-based analysis. It is not a medical diagnosis. Please consult "
          "a physiotherapist or doctor for professional evaluation and treatment.")
    dashboard_text.append("-" * 80 + "\n")

    import os
    from config import RISK_SCORE_OUTPUT_DIR
    txt_path = os.path.join(RISK_SCORE_OUTPUT_DIR, f"{video_name}_recommendations.txt")
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write("\n".join(dashboard_text))
    
    print(f"Saved full dashboard report to: {txt_path}\n")

if __name__ == "__main__":
    main()
