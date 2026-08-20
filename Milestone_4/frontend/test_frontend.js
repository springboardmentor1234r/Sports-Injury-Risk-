import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("Running Milestone 4 Frontend Integration Tests...");

// 1. Verify component file existences
const components = [
  'ReportHeader.jsx',
  'RiskSummaryCard.jsx',
  'AthleteHealthCard.jsx',
  'InjuryRiskSummary.jsx',
  'AnomalySummary.jsx',
  'RecommendationSummary.jsx',
  'DataLimitations.jsx',
  'ReportLoading.jsx',
  'NotificationCard.jsx',
  'NotificationBadge.jsx',
  'NotificationFilters.jsx'
];

components.forEach(comp => {
  const filePath = path.join(__dirname, 'components', comp);
  assert.ok(fs.existsSync(filePath), `Missing component file: ${comp}`);
});
console.log("Frontend Test 1 Passed: All reusable component files verified.");

// 2. Verify page file existences
const pages = [
  'AthleteReport.jsx',
  'AnalysisHistory.jsx',
  'Notifications.jsx'
];

pages.forEach(page => {
  const filePath = path.join(__dirname, 'pages', page);
  assert.ok(fs.existsSync(filePath), `Missing page file: ${page}`);
});
console.log("Frontend Test 2 Passed: All main dashboard page files verified.");

// 3. Test API Client Definition Integrity
import { getReport, generateReport, getHistory, getNotifications, markNotificationRead, evaluateNotifications } from './services/milestone4Api.js';

assert.equal(typeof getReport, 'function');
assert.equal(typeof generateReport, 'function');
assert.equal(typeof getHistory, 'function');
assert.equal(typeof getNotifications, 'function');
assert.equal(typeof markNotificationRead, 'function');
assert.equal(typeof evaluateNotifications, 'function');
console.log("Frontend Test 3 Passed: API endpoint handler bindings verified.");

console.log("All Milestone 4 Frontend Tests Passed successfully!");
process.exit(0);
