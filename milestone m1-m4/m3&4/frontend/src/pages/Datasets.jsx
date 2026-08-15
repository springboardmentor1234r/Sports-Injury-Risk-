import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { datasetAPI } from '../services/api';

const Datasets = () => {
  const { user } = useAuth();
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ingestingId, setIngestingId] = useState(null);
  const [ingestOutput, setIngestOutput] = useState(null);
  const [sampleCounts, setSampleCounts] = useState({});
  const [errorMsg, setErrorMsg] = useState('');

  // Check if user is staff (required for mock ingest trigger)
  const canIngest = user?.role === 'admin' || user?.role === 'coach';

  useEffect(() => {
    const loadDatasetSpecs = async () => {
      try {
        const res = await datasetAPI.listDatasets();
        setDatasets(res.data);
        
        // Setup initial default sample counts for the input fields
        const counts = {};
        res.data.forEach(d => {
          counts[d.name.toLowerCase().replace(/\s/g, '')] = 10;
        });
        setSampleCounts(counts);
      } catch (err) {
        console.error(err);
        setErrorMsg("Failed to synchronize pose dataset configurations.");
      } finally {
        setLoading(false);
      }
    };
    loadDatasetSpecs();
  }, []);

  const handleIngestSimulate = async (datasetId) => {
    const dsKey = datasetId.toLowerCase().replace(/\s/g, '');
    const count = sampleCounts[dsKey] || 10;
    setIngestingId(datasetId);
    setIngestOutput(null);
    setErrorMsg('');

    try {
      // Connect to backend mock ingest endpoint
      const res = await datasetAPI.mockIngest(dsKey, count);
      setIngestOutput({
        dataset: datasetId,
        message: res.data.message,
        samples: res.data.ingested_samples_metadata
      });
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || `Inability to feed ${datasetId} repository. Check administrative privileges.`);
    } finally {
      setIngestingId(null);
    }
  };

  const handleCountChange = (dsKey, value) => {
    setSampleCounts(prev => ({
      ...prev,
      [dsKey]: Math.max(1, parseInt(value) || 1)
    }));
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--color-primary)' }}>
          Pose Estimation Training Datasets
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
          Biomechanical pose tracking models (like MediaPipe or HRNet) require training annotations formats. This page lists reference integrations to format, parse, and mock import annotations to sync custom recordings.
        </p>
      </div>

      {errorMsg && (
        <div style={{
          backgroundColor: 'rgba(255, 75, 75, 0.1)',
          border: '1px solid rgba(255, 75, 75, 0.2)',
          color: 'var(--color-danger)',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.85rem',
          marginBottom: '2rem'
        }}>
          {errorMsg}
        </div>
      )}

      {/* Simulated Pipeline Log Output */}
      {ingestOutput && (
        <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--color-success)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <h4 style={{ color: 'var(--color-success)' }}>Pipeline Log: Ingest Successful</h4>
            <button
              onClick={() => setIngestOutput(null)}
              className="btn btn-secondary"
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
            >
              Clear Log
            </button>
          </div>
          <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>{ingestOutput.message}</p>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <strong>Local Reference Keys Generated:</strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
              {ingestOutput.samples.map(s => (
                <code key={s.local_ref_id} style={{
                  background: 'rgba(255,255,255,0.05)',
                  padding: '0.15rem 0.4rem',
                  borderRadius: '3px',
                  border: '1px solid var(--border-glass)'
                }}>
                  {s.local_ref_id} ({s.mapped_keypoints_shape.join('x')})
                </code>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{
            display: 'inline-block',
            width: '40px',
            height: '40px',
            border: '4px solid var(--border-glass)',
            borderTopColor: 'var(--color-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Parsing annotations databases...</p>
        </div>
      ) : (
        <div className="dataset-grid">
          {datasets.map(ds => {
            const dsKey = ds.name.toLowerCase().replace(/\s/g, '');
            return (
              <div key={ds.name} className="card dataset-card">
                <h3 style={{ fontSize: '1.25rem', color: 'var(--color-secondary)' }}>{ds.name}</h3>
                
                <div className="dataset-meta">
                  <span className="dataset-meta-item">Joints: {ds.keypoints_count}</span>
                  <span className="dataset-meta-item">Format: {ds.joints_format}</span>
                  <span className="dataset-meta-item">Scope: {ds.total_images_videos}</span>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', flex: 1 }}>
                  {ds.description}
                </p>

                <div style={{ marginTop: '1.25rem', marginBottom: '1.25rem' }}>
                  <label className="form-label" style={{ fontSize: '0.7rem', display: 'block', marginBottom: '0.25rem' }}>
                    JSON Schema Preview (Keypoint Object Mapping)
                  </label>
                  <pre className="code-preview">
                    {JSON.stringify(ds.sample_annotation_structure, null, 2)}
                  </pre>
                </div>

                {/* Simulated Pipeline Downloader Controls */}
                <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span className="form-label" style={{ fontSize: '0.6rem', margin: 0 }}>Samples Count:</span>
                    <input
                      type="number"
                      className="form-input"
                      style={{ padding: '0.35rem 0.5rem', width: '70px', fontSize: '0.8rem' }}
                      value={sampleCounts[dsKey] || 10}
                      onChange={(e) => handleCountChange(dsKey, e.target.value)}
                      disabled={ingestingId !== null}
                    />
                  </div>
                  
                  <button
                    onClick={() => handleIngestSimulate(ds.name)}
                    className="btn btn-secondary"
                    style={{
                      flex: 1,
                      fontSize: '0.8rem',
                      padding: '0.5rem 0.75rem',
                      borderColor: 'var(--color-primary)',
                      marginTop: 'auto'
                    }}
                    disabled={ingestingId !== null}
                  >
                    {ingestingId === ds.name ? "Running Pipeline..." : "Simulate Ingest"}
                  </button>
                </div>
                
                {!canIngest && (
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
                    * Staff roles (Coaches / Admins) can simulate database ingest operations.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Datasets;
