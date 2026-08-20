# Milestone 3 Frontend: Athlete Intelligence Dashboard

This directory houses the user-facing Athlete Intelligence Dashboard which consumes sports-biomechanics, telemetry anomalies, injury predictions, and corrective recommendations.

## Purpose
The Athlete Intelligence Dashboard translates high-velocity joint calculations from OpenCV/MediaPipe into a high-fidelity sports-tech HUD. It allows coaches, physiotherapists, and athletes to quickly evaluate:
1. **Overall Injury Risk Score:** Tabulated composite risk (0 to 100, where **higher is worse**).
2. **Overall Athlete Health Score:** Tabulated physical wellness index (0 to 100, where **higher is better**).
3. **5-Factor Weighted Score Breakdown:** A clear breakdown showing Category, Score, Weight, and Contribution.
4. **Active Recommendations:** Actionable mobility, corrective alignment, strengthening, and load modification routines.
5. **Observed Anomalies:** Bill of technique errors with severity levels and frame references.

---

## Directory Component Map
```text
milestone3/frontend/
├── components/
│   ├── RiskScoreCard.jsx             # Overall risk score visual gauge & progress indicator
│   ├── RiskCategoryBadge.jsx         # Color-coded severity badge (Low, Moderate, High, Critical)
│   ├── InjuryRiskCards.jsx           # Cards for joint predictions (ACL, Hamstring, Sprains, Back, etc.)
│   ├── AnomalyList.jsx               # Telemetry list of technique errors with severity filters
│   ├── RecommendationCards.jsx       # Grouped corrective intervention plans (Strengthening, Mobility, etc.)
│   ├── RiskBreakdown.jsx             # Weight factor audit breakdown table
│   ├── AthleteHealthSummary.jsx      # Sub-metric index (Movement Quality, Efficiency, Fatigue)
│   ├── DataLimitations.jsx           # Audit alert for unlinked sensors / missing history metrics
│   ├── RiskTrend.jsx                 # Historical trend telemetry placeholder
│   └── IntelligenceLoading.jsx       # High-fidelity loading skeleton loader
│
├── pages/
│   └── AthleteIntelligence.jsx        # Main coordinator controller page
│
├── services/
│   └── intelligenceApi.js            # Axios client endpoint handlers
│
└── README.md                         # This reference documentation
```

---

## Routing
Registered on the main routing table under the path:
* **`/milestone3/intelligence/:sessionId`**

Protected by `ProtectedRoute` to restrict unauthenticated access. It verifies session ownership based on user roles:
* Coaches/Admins: Access to view any session.
* Athletes: Allowed to view only sessions matching their authenticated profile.

---

## API Endpoints Consumed
* `GET /milestone3/analysis/{session_id}` (Combined dashboard endpoint)
* `GET /milestone2/analysis/status/{session_id}` (Retrieves session metadata)
* `GET /athletes` (Checks profile associations)

---

## Medical Presentation Principles
To comply with medical screening safety requirements:
* Displays warnings emphasizing that screening is automated and does **not** replace diagnostic medical consultations.
* Uses wording such as *"Elevated ACL Risk"* instead of diagnosing injuries directly.
