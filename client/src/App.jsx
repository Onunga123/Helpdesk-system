import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API}/`)
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <main className="wrap">
      <h1>TUC ICT Help Desk</h1>
      <p className="muted">Client is running. Backend should be on port 5000.</p>
      {error && <p className="err">Could not reach API: {error}</p>}
      {data && (
        <pre className="box">{JSON.stringify(data, null, 2)}</pre>
      )}
    </main>
  );
}
