import { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [status, setStatus] = useState('checking...');

  useEffect(() => {
    axios.get('http://localhost:8000/health')
      .then(res => setStatus(res.data.status))
      .catch(() => setStatus('backend not reachable'));
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Sports Injury Risk Detection</h1>
      <p>Backend status: <strong>{status}</strong></p>
    </div>
  );
}

export default App;