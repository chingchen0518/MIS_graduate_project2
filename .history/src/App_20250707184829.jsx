import React, { useEffect, useState } from 'react';

function App() {
  const [data, setData] = useState({
    users: [],
    trips: [],
    schedules: [],
    attractions: [],
    weekdays: [],
    joins: [],
    include2s: [],
    evaluates: [],
    supports: [],
    businesses: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/travel')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setError(null);
      })
      .catch(err => {
        setError('無法取得資料：' + err.message);
        setData({});
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>🚀 資料載入中...</p>;
  if (error) return <p style={{ color: 'red' }}>❌ {error}</p>;

  const renderTable = (title, rows) => {
    if (!rows || rows.length === 0) {
      return (
        <div style={{ marginBottom: '20px' }}>
          <h2>{title}</h2>
          <p>沒有資料</p>
        </div>
      );
    }

    const headers = Object.keys(rows[0]);

    return (
      <div style={{ marginBottom: '30px' }}>
        <h2>{title}</h2>
        <table border="1" cellPadding="5" cellSpacing="0">
          <thead>
            <tr>
              {headers.map(col => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                {headers.map(col => (
                  <td key={col}>{String(row[col])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>📋 資料總覽（10 張資料表）</h1>
      {renderTable('👤 User 使用者', data.users)}
      {renderTable('🧳 Trip 行程', data.trips)}
      {renderTable('📅 Schedule 排程', data.schedules)}
      {renderTable('📍 Attraction 景點', data.attractions)}
      {renderTable('📆 Weekday 星期表', data.weekdays)}
      {renderTable('👥 Join 參與者', data.joins)}
      {renderTable('🔗 Include2 行程安排', data.include2s)}
      {renderTable('⭐ Evaluate 評價', data.evaluates)}
      {renderTable('💬 Support 支持理由', data.supports)}
      {renderTable('🏢 Business 營業資訊', data.businesses)}
    </div>
  );
}

export default App;
