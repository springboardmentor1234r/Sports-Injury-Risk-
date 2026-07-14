

import os
import argparse
from typing import TypedDict, List, Dict

import pandas as pd
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langgraph.graph import StateGraph, END
from pydantic import BaseModel, Field

from config import RISK_SCORE_OUTPUT_DIR, RECOMMENDATION_OUTPUT_DIR

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
    video_name = state["video_name"]
    risk_score_path = os.path.join(RISK_SCORE_OUTPUT_DIR, f"{video_name}_risk_score.csv")

    df = pd.read_csv(risk_score_path)
    row = df.iloc[0]

    flagged_raw = row.get("flagged_issues", "None")
    if flagged_raw == "None" or pd.isna(flagged_raw):
        flagged_issues = []
    else:
        flagged_issues = [issue.strip() for issue in flagged_raw.split("|")]

    state["risk_data"] = row.to_dict()
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

    # Human-readable written report (TXT) saved to risk scores directory
    txt_path = os.path.join(RISK_SCORE_OUTPUT_DIR, f"{video_name}_recommendations.txt")
    
    summary = state["structured_summary"]
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write(f"Recommendation Report: {video_name}\n")
        f.write("=" * 60 + "\n\n")
        f.write(summary.get("one_line_summary", "") + "\n\n")
        
        for cat in summary.get("categories", []):
            f.write(f"## {cat.get('category_name', '').replace('_', ' ').title()}\n")
            f.write(f"Issue: {cat.get('issue_translation', '')}\n")
            f.write(f"Explanation: {cat.get('explanation', '')}\n")
            f.write("Recommended Exercises:\n")
            for ex in cat.get("recommended_exercises", []):
                f.write(f"- {ex}\n")
            f.write("\n")
            
        f.write(summary.get("wrap_up_summary", "") + "\n")

    state["output_path"] = csv_path
    print(f"Saved recommendations CSV to: {csv_path}")
    print(f"Saved written report (TXT) to: {txt_path}")
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
