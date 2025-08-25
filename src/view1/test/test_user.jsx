import React, { useEffect, useState } from "react";
import axios from "axios";

export default function UsersByTrip({ tripId = "1" }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:3001/api/user")
      .then(res => {
        const data = res.data;

        // 🔑 篩選 into_trip 包含 tripId 的使用者
        const filtered = data.filter(user =>
          Array.isArray(user.into_trip) && user.into_trip.includes(tripId)
        );

        setUsers(filtered);
      })
      .catch(err => console.error("❌ 載入使用者失敗:", err));
  }, [tripId]);

  return (
    <div style={{ padding: 20 }}>
      <h2>t_id = {tripId} 的使用者</h2>
      {users.length === 0 ? (
        <p>沒有找到使用者</p>
      ) : (
        <ul>
          {users.map(u => (
            <li key={u.u_id}>
              <img src={u.u_img} alt={u.u_name} width="40" style={{ borderRadius: "50%", marginRight: 10 }} />
              {u.u_name} ({u.u_email})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}