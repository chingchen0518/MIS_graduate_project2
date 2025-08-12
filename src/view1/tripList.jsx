import React, { useEffect, useState } from 'react';

function TripList() {
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3001/api/vistor') // 後端設定的 API 路由
      .then(res => res.json())
      .then(data => setTrips(data))
      .catch(console.error);
  }, []);

  return (
    <div>
      <h2>旅遊行程列表</h2>
      {trips.length === 0 && <p>載入中或無資料</p>}

      {trips.map(trip => (
        <div key={trip.t_id} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
          <h3>{trip.title} - {trip.country}</h3>
          <p>建立者: {trip.Creator?.u_name || '無'}</p>
          <p>行程階段: {trip.stage}</p>

          {/* 參與成員 */}
          <h4>參與成員：</h4>
          <ul>
            {trip.Users?.map(user => (
              <li key={user.u_id}>{user.u_name}</li>
            ))}
          </ul>

          {/* 行程排程與景點 */}
          <h4>行程排程：</h4>
          <ul>
            {trip.Schedules?.map(schedule => (
              <li key={schedule.s_id}>
                <p>日期: {schedule.date}，順序: {schedule.sequence}</p>

                <ul>
                  {schedule.Attractions?.map(attraction => (
                    <li key={attraction.a_id}>
                      景點: {attraction.name} ({attraction.category}) - 地址: {attraction.address}
                      <ul>
                        {attraction.Weekdays?.map(day => (
                          <li key={day.w_day}>
                            營業日: {day.w_day} ({day.period}) {day.open_time} - {day.close_time}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>

                {/* 評價紀錄 */}
                <h5>評價紀錄：</h5>
                <ul>
                  {schedule.Users?.map(user => (
                    <li key={user.u_id}>
                      評價者: {user.u_name} - 
                      {user.Evaluate?.good ? '👍好評 ' : ''}
                      {user.Evaluate?.bad ? '👎差評 ' : ''}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>

          {/* 景點支持者 */}
          <h4>景點支持者與原因：</h4>
          {trip.Attractions?.map(attraction => (
            <div key={attraction.a_id}>
              <strong>{attraction.name} 支持者：</strong>
              <ul>
                {attraction.Users?.map(user => (
                  <li key={user.u_id}>
                    {user.u_name} - 支持原因: {user.Support?.Reason || '無'}
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

export default TripList;
