import React, { useEffect, useState } from 'react';

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/travel')
      .then(res => {
        if (!res.ok) throw new Error('網路錯誤');
        return res.json();
      })
      .then(json => setData(json))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>載入中...</p>;
  if (error) return <p>錯誤: {error}</p>;
  if (!data.length) return <p>沒有資料</p>;

  return (
    <div>
      <h1>旅遊行程</h1>
      {data.map(trip => (
        <div key={trip.t_id}>
          <h2>{trip.title} ({trip.country})</h2>
          <p>建立者: {trip.Creator?.u_name || '無'}</p>
        </div>
      ))}
    </div>
  );
}

export default App;
