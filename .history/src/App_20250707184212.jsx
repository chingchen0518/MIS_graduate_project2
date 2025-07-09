import React, { useEffect, useState } from 'react';

function App() {
  const [data, setData] = useState(null);  // 存放整個大物件
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
  if (!data) return <p>沒有資料</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>所有資料總覽</h1>

      <section>
        <h2>使用者 (Users)</h2>
        <ul>
          {data.users.map(u => (
            <li key={u.u_id}>{u.u_name} ({u.u_account})</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>旅遊行程 (Trips)</h2>
        <ul>
          {data.trips.map(t => (
            <li key={t.t_id}>{t.title} - {t.country} (階段: {t.stage})</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>排程 (Schedules)</h2>
        <ul>
          {data.schedules.map(s => (
            <li key={s.s_id}>日期: {s.date}，行程ID: {s.t_id}，使用者ID: {s.u_id}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>景點 (Attractions)</h2>
        <ul>
          {data.attractions.map(a => (
            <li key={a.a_id}>{a.name} - {a.category} - 地址: {a.address}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>星期 (Weekdays)</h2>
        <ul>
          {data.weekdays.map(w => (
            <li key={w.w_day}>{w.w_day}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>加入 (Joins)</h2>
        <ul>
          {data.joins.map(j => (
            <li key={`${j.u_id}-${j.t_id}`}>使用者ID: {j.u_id}，行程ID: {j.t_id}，顏色: {j.color}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Include2</h2>
        <ul>
          {data.include2s.map(i => (
            <li key={`${i.s_id}-${i.a_id}-${i.t_id}`}>排程ID: {i.s_id}，景點ID: {i.a_id}，行程ID: {i.t_id}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>評價 (Evaluates)</h2>
        <ul>
          {data.evaluates.map(e => (
            <li key={`${e.u_id}-${e.s_id}-${e.t_id}`}>
              使用者ID: {e.u_id}，排程ID: {e.s_id}，行程ID: {e.t_id}，
              {e.good ? '👍好評' : ''} {e.bad ? '👎差評' : ''}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>支持 (Supports)</h2>
        <ul>
          {data.supports.map(s => (
            <li key={`${s.u_id}-${s.a_id}`}>使用者ID: {s.u_id}，景點ID: {s.a_id}，原因: {s.reason}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>商業資訊 (Businesses)</h2>
        <ul>
          {data.businesses.map(b => (
            <li key={`${b.a_id}-${b.t_id}-${b.w_day}-${b.period}`}>
              景點ID: {b.a_id}，行程ID: {b.t_id}，星期: {b.w_day}，時段: {b.period}，
              開始: {b.open_time}，結束: {b.close_time}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default App;
