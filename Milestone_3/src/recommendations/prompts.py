from typing import TypedDict, List, Dict
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate

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

