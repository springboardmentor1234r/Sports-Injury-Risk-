

import os
import argparse
from typing import TypedDict, List, Dict

import pandas as pd
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langgraph.graph import StateGraph, END
from pydantic import BaseModel, Field
import sys

from config import RISK_SCORE_OUTPUT_DIR, RECOMMENDATION_OUTPUT_DIR

# Import database module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    from database import mongo_utils
except ImportError:
    pass

# --- Load .env file (GROQ_API_KEY, LANGCHAIN_* variables for LangSmith tracing) ---
load_dotenv()


# =========================================================================
# RULE-BASED EXERCISE LOOKUP TABLE
# This is the "source of truth" for WHAT to recommend. The LLM later only
# explains/presents these -- it does not invent new exercises.
# =========================================================================

EXERCISE_LOOKUP: Dict[str, List[str]] = {
    "restricted_rom": [
        "Dynamic stretching for the affected joint",
        "Foam rolling / mobility drills before training",
        "Gradual range-of-motion progression exercises",
    ],
    "unstable_rom": [
        "Controlled tempo strength training (slow eccentrics)",
        "Joint stability exercises (e.g., wall sits, isometric holds)",
        "Proprioceptive/balance training for that joint",
    ],
    "poor_alignment": [
        "Glute activation exercises (clamshells, lateral band walks)",
        "Core and hip stability work",
        "Single-leg squats with alignment focus (mirror feedback)",
    ],
    "balance_issue": [
        "Single-leg balance drills (eyes open, then eyes closed)",
        "Bosu ball / unstable surface training",
        "Proprioception and ankle stability drills",
    ],
    "asymmetry": [
        "Unilateral (single-side) strength training",
        "Single-leg deadlifts / split squats",
        "Focused correctional work on the weaker side",
    ],
    "fatigue": [
        "Reduce training volume temporarily (active recovery)",
        "Prioritize sleep and recovery nutrition",
        "Monitor session-to-session movement quality trends",
    ],
    "injury_history": [
        "Targeted rehab/prehab exercises for the previously injured area",
        "Gradual load progression with physiotherapist guidance",
        "Strengthening surrounding stabilizing muscles",
    ],
    "high_training_load": [
        "Consider a deload week (reduced volume/intensity)",
        "Improve recovery protocols between sessions",
        "Reassess training plan with a coach",
    ],
    "general": [
        "General mobility and strength maintenance program",
        "Continue regular movement screening",
    ],
}


# =========================================================================
# LANGGRAPH STATE -- the data that flows between each node in the pipeline
# =========================================================================

class CategoryRecommendation(BaseModel):
    category_name: str
    issue_translation: str = Field(description="Plain English translation of the flagged issues in this category")
    explanation: str = Field(description="What the issue means and why it matters")
    recommended_exercises: list[str]

class RecommendationOutput(BaseModel):
    one_line_summary: str = Field(description="Single-sentence plain-English summary of overall movement concerns")
    categories: list[CategoryRecommendation]
    wrap_up_summary: str = Field(description="A short overall summary paragraph")

class RecommendationState(TypedDict):
    session_id: str
    video_name: str
    risk_data: Dict
    flagged_issues: List[str]
    categorized_issues: Dict[str, List[str]]   # category -> list of raw issue strings
    recommended_exercises: Dict[str, List[str]]  # category -> list of exercises
    structured_summary: dict
    output_path: str


# =========================================================================
# NODE 1: Load risk data
# =========================================================================

def load_risk_data(state: RecommendationState) -> RecommendationState:
    session_id = state.get("session_id")
    video_name = state["video_name"]
    
    try:
        # Try to load from MongoDB first
        risk_doc = mongo_utils.get_risk_score(session_id)
        row_dict = risk_doc.get("risk_data", {})
        flagged_raw = row_dict.get("flagged_issues", "None")
    except (NameError, ValueError):
        # Fallback to CSV if DB fails or isn't available
        print("mongo_utils not imported or session not found, falling back to CSV")
        risk_score_path = os.path.join(RISK_SCORE_OUTPUT_DIR, f"{video_name}_risk_score.csv")
        df = pd.read_csv(risk_score_path)
        row = df.iloc[0]
        row_dict = row.to_dict()
        flagged_raw = row_dict.get("flagged_issues", "None")

    if flagged_raw == "None" or pd.isna(flagged_raw):
        flagged_issues = []
    else:
        flagged_issues = [issue.strip() for issue in str(flagged_raw).split("|")]

    state["risk_data"] = row_dict
    state["flagged_issues"] = flagged_issues
    return state


# =========================================================================
# NODE 2: Categorize issues (RULE-BASED / if-else)
# =========================================================================

def categorize_issues(state: RecommendationState) -> RecommendationState:
    categorized: Dict[str, List[str]] = {}

    for issue in state["flagged_issues"]:
        issue_lower = issue.lower()

        if "rom" in issue_lower and "too low" in issue_lower:
            category = "restricted_rom"
        elif "rom" in issue_lower and "too high" in issue_lower:
            category = "unstable_rom"
        elif "joint_alignment" in issue_lower:
            category = "poor_alignment"
        elif "balance_sway" in issue_lower:
            category = "balance_issue"
        elif "symmetry_avg" in issue_lower:
            category = "asymmetry"
        elif "fatigue" in issue_lower or "dropped by" in issue_lower:
            category = "fatigue"
        elif "previous" in issue_lower and "injury" in issue_lower:
            category = "injury_history"
        elif "training load" in issue_lower:
            category = "high_training_load"
        else:
            category = "general"

        categorized.setdefault(category, []).append(issue)

    state["categorized_issues"] = categorized
    return state


# =========================================================================
# NODE 3: Look up exercises (RULE-BASED)
# =========================================================================

def lookup_exercises(state: RecommendationState) -> RecommendationState:
    recommended: Dict[str, List[str]] = {}

    for category in state["categorized_issues"]:
        recommended[category] = EXERCISE_LOOKUP.get(category, EXERCISE_LOOKUP["general"])

    state["recommended_exercises"] = recommended
    return state


# =========================================================================
# NODE 4: Generate the LLM write-up (via Groq, through LangChain)
# =========================================================================

RECOMMENDATION_PROMPT = ChatPromptTemplate.from_messages([
    ("system",
     "You are a sports physiotherapist assistant. You are given a list of "
     "flagged biomechanical issues detected from video analysis, grouped by "
     "category, along with pre-approved corrective exercises for each category.\n\n"
     "1. First, provide a single-sentence plain-English summary of the overall movement concerns.\n"
     "2. Next, for each category: explicitly translate the raw flagged issues into plain English "
     "(e.g., instead of 'right_elbow_rom too high (179.3 deg)', write 'Your right elbow shows signs of hyperextension/instability during this movement').\n"
     "3. Explain what the issue means and why it matters, then present the recommended exercises.\n"
     "Do NOT invent new exercises beyond the ones provided.\n"
     "Keep it concise, supportive, and easy to understand for a non-medical reader.\n"
     "End with a short overall summary paragraph."),
    ("human",
     "Risk Category: {risk_category}\n"
     "Overall Health Score: {health_score}/100\n\n"
     "Flagged issues by category:\n{categorized_issues}\n\n"
     "Approved exercises by category:\n{recommended_exercises}\n\n"
     "Please write the full explanation and recommendations now."),
])


def generate_recommendation(state: RecommendationState) -> RecommendationState:
    llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.4)
    structured_llm = llm.with_structured_output(RecommendationOutput)

    chain = RECOMMENDATION_PROMPT | structured_llm

    response = chain.invoke({
        "risk_category": state["risk_data"].get("risk_category", "Unknown"),
        "health_score": state["risk_data"].get("overall_health_score", "N/A"),
        "categorized_issues": state["categorized_issues"],
        "recommended_exercises": state["recommended_exercises"],
    })

    state["structured_summary"] = response.model_dump()
    return state


# =========================================================================
# NODE 5: Save output
# =========================================================================

def save_output(state: RecommendationState) -> RecommendationState:
    os.makedirs(RECOMMENDATION_OUTPUT_DIR, exist_ok=True)
    os.makedirs(RISK_SCORE_OUTPUT_DIR, exist_ok=True)
    video_name = state["video_name"]

    # Structured CSV (for future database/dashboard use)
    rows = []
    for category, issues in state["categorized_issues"].items():
        exercises = state["recommended_exercises"].get(category, [])
        rows.append({
            "category": category,
            "flagged_issues": " | ".join(issues),
            "recommended_exercises": " | ".join(exercises),
        })
    csv_path = os.path.join(RECOMMENDATION_OUTPUT_DIR, f"{video_name}_recommendations.csv")
    pd.DataFrame(rows).to_csv(csv_path, index=False)

    # Save structured to MongoDB
    summary = state["structured_summary"]
    session_id = state.get("session_id")
    try:
        if session_id:
            mongo_utils.save_recommendations(session_id, summary)
    except NameError:
        pass # mongo_utils not imported

    # Build the full text report string
    risk_data = state["risk_data"]
    health_score = risk_data.get("overall_health_score", 0)
    risk_cat = risk_data.get("risk_category", "Unknown")
    
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

    categories = summary.get("categories", [])
    
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
    dashboard_text.append("Disclaimer: This is an AI-assisted movement screening tool based on video pose ")
    dashboard_text.append("estimation and rule-based analysis. It is not a medical diagnosis. Please consult ")
    dashboard_text.append("a physiotherapist or doctor for professional evaluation and treatment.")
    dashboard_text.append("-" * 80 + "\n")

    full_report_string = "\n".join(dashboard_text)

    # Save text report to MongoDB
    try:
        if session_id:
            mongo_utils.save_full_report(session_id, full_report_string)
    except NameError:
        pass # mongo_utils not imported

    state["output_path"] = csv_path
    print(f"Saved recommendations CSV to: {csv_path}")
    print(f"Saved full text report to MongoDB (session: {session_id})")
    return state


# =========================================================================
# BUILD THE LANGGRAPH PIPELINE
# =========================================================================

def build_graph():
    graph = StateGraph(RecommendationState)

    graph.add_node("load_risk_data", load_risk_data)
    graph.add_node("categorize_issues", categorize_issues)
    graph.add_node("lookup_exercises", lookup_exercises)
    graph.add_node("generate_recommendation", generate_recommendation)
    graph.add_node("save_output", save_output)

    graph.set_entry_point("load_risk_data")
    graph.add_edge("load_risk_data", "categorize_issues")
    graph.add_edge("categorize_issues", "lookup_exercises")
    graph.add_edge("lookup_exercises", "generate_recommendation")
    graph.add_edge("generate_recommendation", "save_output")
    graph.add_edge("save_output", END)

    return graph.compile()


if __name__ == "__main__":
    import glob
    parser = argparse.ArgumentParser(description="Generate corrective exercise recommendations.")
    parser.add_argument(
        "--video_name", required=False,
        help="Base name of the video (e.g. 'sports', matching sports_risk_score.csv)"
    )
    parser.add_argument("--session_id", required=False, help="Session ID for MongoDB")
    args = parser.parse_args()

    video_name = args.video_name
    if not video_name:
        # Auto-detect from the outputs/risk_scores directory
        files = glob.glob(os.path.join(RISK_SCORE_OUTPUT_DIR, "*_risk_score.csv"))
        if not files:
            print("No risk score files found in", RISK_SCORE_OUTPUT_DIR)
            print("Please run risk_scoring_engine.py first.")
            exit(1)
        elif len(files) == 1:
            video_name = os.path.basename(files[0]).replace("_risk_score.csv", "")
            print(f"Auto-detected video name: '{video_name}'")
        else:
            print("Multiple risk score files found:")
            for i, f in enumerate(files):
                print(f"  {i+1}. {os.path.basename(f).replace('_risk_score.csv', '')}")
            choice = input("Enter the number of the video to process: ")
            try:
                idx = int(choice) - 1
                video_name = os.path.basename(files[idx]).replace("_risk_score.csv", "")
            except (ValueError, IndexError):
                print("Invalid choice. Exiting.")
                exit(1)

    app = build_graph()

    initial_state: RecommendationState = {
        "session_id": args.session_id or "",
        "video_name": video_name,
        "risk_data": {},
        "flagged_issues": [],
        "categorized_issues": {},
        "recommended_exercises": {},
        "structured_summary": {},
        "output_path": "",
    }

    final_state = app.invoke(initial_state)

    print("\n" + "=" * 60)
    print("RECOMMENDATION SUMMARY (STRUCTURED)")
    print("=" * 60)
    print(final_state["structured_summary"]["one_line_summary"])

    # ==========================================
    # FINAL CSV CLEANUP
    # ==========================================
    risk_score_csv = os.path.join(RISK_SCORE_OUTPUT_DIR, f"{video_name}_risk_score.csv")
    recs_csv = os.path.join(RECOMMENDATION_OUTPUT_DIR, f"{video_name}_recommendations.csv")
    
    files_to_delete = [risk_score_csv, recs_csv]
    deleted_count = 0
    for file_path in files_to_delete:
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                deleted_count += 1
            except Exception as e:
                print(f"Warning: Could not delete {file_path}: {e}")
                
    # Safely try to remove empty directories
    directories_to_check = [RISK_SCORE_OUTPUT_DIR, RECOMMENDATION_OUTPUT_DIR]
    for directory in directories_to_check:
        if os.path.exists(directory):
            try:
                os.rmdir(directory)
            except OSError:
                pass # Directory not empty, which is fine
                
    if deleted_count > 0:
        print(f"\nFinal Cleanup: Deleted {deleted_count} CSV files and empty folders. All data is now exclusively in MongoDB!")
