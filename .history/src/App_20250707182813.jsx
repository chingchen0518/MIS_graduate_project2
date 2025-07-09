import React, { useEffect, useState } from 'react';

function App() {
  const [data, setData] = useState([]); // 旅遊行程及相關資料
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/travels')
      .then(res => res.json())
      .then(json => {
        if (Array.isArray(json)) {
          setData(json);
        } else {
          console.warn('後端回傳資料格式非預期:', json);
          setData([]);
        }
      })
      .catch(err => {
        setError(err.message || '無法取得資料');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>載入中...</p>;
  if (error) return <p>錯誤: {error}</p>;
  if (data.length === 0) return <p>沒有任何資料</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>旅遊行程與相關資料總覽</h1>
      {data.map(trip => (
        <div key={trip.t_id} style={{ border: '1px solid #ddd', marginBottom: 20, padding: 15 }}>
          <h2>{trip.title} ({trip.country})</h2>
          <p>建立者: {trip.Creator?.u_name || '無資料'}</p>
          <p>階段: {trip.stage || '無資料'}</p>
          <p>開始日期: {trip.s_date} ~ 結束日期: {trip.e_date}</p>

          <h3>行程參與者</h3>
          <ul>
            {(trip.Users || []).map(user => (
              <li key={user.u_id}>{user.u_name} ({user.u_account})</li>
            ))}
          </ul>

          <h3>排程</h3>
          {(trip.Schedules || []).map(schedule => (
            <div key={schedule.s_id} style={{ marginBottom: 10, paddingLeft: 10 }}>
              <p>日期: {schedule.date}</p>
              <p>建立者: {schedule.User?.u_name || '無資料'}</p>

              <h4>景點</h4>
              {(schedule.Attractions || []).map(attraction => (
                <div key={attraction.a_id} style={{ marginLeft: 15, marginBottom: 5 }}>
                  <strong>{attraction.name}</strong> - 類別: {attraction.category} - 地址: {attraction.address}
                  <div>
                    營業日與時間：
                    <ul>
                      {(attraction.Weekdays || []).map(day => (
                        <li key={day.w_day}>
                          {day.w_day} (時段 {day.period})：{day.open_time} - {day.close_time}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    支持者：
                    <ul>
                      {(attraction.Users || []).map(user => (
                        <li key={user.u_id}>
                          {user.u_name} - 理由: {user.Support?.reason || '無'}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}

              <h4>評價</h4>
              <ul>
                {(schedule.Users || []).map(user => (
                  <li key={user.u_id}>
                    評價者: {user.u_name} - 
                    {user.Evaluate?.good ? '👍 好評' : ''}
                    {user.Evaluate?.bad ? '👎 差評' : ''}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default App;
