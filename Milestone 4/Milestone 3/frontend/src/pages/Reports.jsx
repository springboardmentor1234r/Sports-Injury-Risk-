import React, { useState, useEffect } from 'react';
import { FileText, Download, Eye, Printer } from 'lucide-react';
import { reportAPI } from '../services/api';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await reportAPI.getAll();
      setReports(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = async (analysisId) => {
    try {
      const res = await reportAPI.getById(analysisId);
      setSelectedReport(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Biomechanical Reports & Exports</h1>
        <p className="page-subtitle">Generate printable PDF analysis reports for athletes, coaches, and medical staff.</p>
      </div>

      {loading ? (
        <div className="state-box">
          <div className="spinner" />
          <p>Loading reports...</p>
        </div>
      ) : (
        <div className="grid-2">
          <div className="card">
            <h3 className="card-title">Generated Clinical Reports</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {reports.map((r) => (
                <div key={r.id} style={styles.reportRow}>
                  <div>
                    <strong style={{ fontSize: '0.9rem', color: '#1F2937' }}>{r.athlete_name}</strong>
                    <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>{r.video_name} | {new Date(r.generated_at).toLocaleDateString()}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="badge badge-low">{r.risk_level}</span>
                    <button onClick={() => handleViewReport(r.analysis_id)} className="btn btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}>
                      <Eye size={14} />
                      <span>View</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedReport ? (
            <div className="card" style={{ border: '2px solid #15803D' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#15803D' }}>Report Document Preview</h3>
                <button onClick={handlePrint} className="btn btn-primary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}>
                  <Printer size={14} />
                  <span>Print Report</span>
                </button>
              </div>

              <div style={styles.printArea}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1F2937', marginBottom: '0.25rem' }}>{selectedReport.report_title}</h2>
                <p style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '1rem' }}>Athlete: <strong>{selectedReport.athlete_name}</strong> | Date: {new Date(selectedReport.analysis_date).toLocaleString()}</p>

                <div style={{ backgroundColor: '#F0FDF4', padding: '0.85rem', borderRadius: '8px', marginBottom: '1rem' }}>
                  <p><strong>Overall Risk Score:</strong> {selectedReport.overall_risk_score} / 100 ({selectedReport.risk_level})</p>
                  <p><strong>Movement Quality Score:</strong> {selectedReport.movement_quality_score}%</p>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.35rem' }}>6 Injury Prediction Probabilities</h4>
                  <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem' }}>
                    <li>ACL Risk: {selectedReport.injury_predictions?.acl_risk}%</li>
                    <li>Hamstring Risk: {selectedReport.injury_predictions?.hamstring_risk}%</li>
                    <li>Ankle Sprain Risk: {selectedReport.injury_predictions?.ankle_sprain_risk}%</li>
                    <li>Overuse Risk: {selectedReport.injury_predictions?.overuse_risk}%</li>
                  </ul>
                </div>

                <p style={{ fontSize: '0.75rem', color: '#9CA3AF', fontStyle: 'italic' }}>{selectedReport.report_footer}</p>
              </div>
            </div>
          ) : (
            <div className="card state-box">
              <FileText size={40} color="#9CA3AF" />
              <p style={{ marginTop: '0.75rem' }}>Select a report from the list to preview printable report structure.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  reportRow: {
    padding: '0.85rem 1rem',
    backgroundColor: '#F8FAF9',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  printArea: {
    padding: '1rem',
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
  },
};

export default Reports;
