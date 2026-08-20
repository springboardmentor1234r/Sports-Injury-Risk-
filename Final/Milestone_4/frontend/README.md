# Milestone 4 Frontend: Athlete Reporting & Intelligence Dashboard

This directory houses the user-facing Athlete Reporting, Trend History, and Notification Center modules for Milestone 4. It runs as a completely isolated standalone React + Vite application.

## Folder Structure
```text
milestone4/frontend/
├── components/
│   ├── AthleteHealthCard.jsx         # Health score indexes panel
│   ├── AnomalySummary.jsx            # Technique anomalies detail table
│   ├── DataLimitations.jsx           # Warning indicator log
│   ├── InjuryRiskSummary.jsx         # Joint probability block grid
│   ├── NotificationBadge.jsx         # Unread counter indicators
│   ├── NotificationCard.jsx          # Alert card rendering actions
│   ├── NotificationFilters.jsx       # Read/unread status selectors
│   ├── RecommendationSummary.jsx     # Training/recovery tabbed suggestions
│   ├── ReportHeader.jsx              # Summary identity tags
│   ├── RiskSummaryCard.jsx           # Overall risk index visual gauge
│   └── ReportLoading.jsx             # High-fidelity loader skeleton
│
├── pages/
│   ├── AthleteReport.jsx             # Main compiled report card layout
│   ├── AnalysisHistory.jsx           # Time-series trend line plotting curves
│   └── Notifications.jsx             # System alerts dashboard controller
│
├── services/
│   └── milestone4Api.js              # Axios request config
│
├── index.html                        # Standalone page template
├── index.css                         # System CSS stylesheets & Print overrides
├── main.jsx                          # Standalone routing tree coordinator
└── package.json                      # Independent dev server scripts
```

---

## Standalone Execution
This module runs independently from the root application on port `5174`.

### Development Build Commands:
```bash
# Go to the frontend workspace
cd milestone4/frontend

# Install node dependencies
npm install

# Run isolated dev server
npm run dev
```

---

## Print Views
Includes optimized `@media print` rules inside `index.css` to hide headers, nav menus, and buttons, adjusting margins and text sizes to match standard PDF report printing layout dimensions.
