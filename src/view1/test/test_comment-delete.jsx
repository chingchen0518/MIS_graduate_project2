import React, { useEffect, useState } from "react";
import axios from "axios";

export default function DeleteComment() {
  const FIXED_TID = 1;       // 預設 trip id
  const CURRENT_USER = "CCC"; // 預設使用者

  const [comments, setComments] = useState([]);
  const [message, setMessage] = useState("");

  // 讀取所有評論
  const fetchComments = async () => {
    try {
      const res = await axios.get("http://localhost:3001/api/comments");
      const data = Array.isArray(res.data) ? res.data : [];

      // 找到 t_id = 1 的資料
      const trip = data.find((t) => t.t_id === FIXED_TID);
      if (!trip) {
        setComments([]);
        return;
      }

      // 展平成 {a_id, index, user_id, content, created_at}
      const flat = [];
      trip.comments.forEach((c) => {
        (c.content || []).forEach((txt, i) => {
          flat.push({
            a_id: c.a_id,
            index: i,
            user_id: c.user_id[i],
            content: txt,
            created_at: c.created_at[i],
          });
        });
      });

      setComments(flat);
    } catch (err) {
      console.error("❌ 讀取評論失敗:", err);
      setMessage("❌ 無法讀取評論");
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  // 刪除評論
  const handleDelete = async (a_id, index) => {
    try {
      const res = await axios.delete("http://localhost:3001/api/comments-delete", {
        data: { t_id: FIXED_TID, a_id, index },
      });
      setMessage(res.data.message || "刪除成功");
      fetchComments(); // 重新載入評論
    } catch (err) {
      console.error("❌ 刪除失敗:", err);
      setMessage("❌ 刪除失敗：" + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div style={{ maxWidth: "500px", margin: "20px auto", fontFamily: "Arial" }}>
      <h2>評論列表 (t_id=1)</h2>
      {message && <p style={{ color: "red" }}>{message}</p>}
      {comments.length === 0 ? (
        <p>目前沒有評論</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {comments.map((c, i) => (
            <li key={`${c.a_id}-${i}`} style={{ marginBottom: "12px", padding: "8px", border: "1px solid #ddd", borderRadius: "6px" }}>
              <div><strong>景點 a_id:</strong> {c.a_id}</div>
              <div><strong>使用者:</strong> {c.user_id}</div>
              <div><strong>內容:</strong> {c.content}</div>
              <div><small>{new Date(c.created_at).toLocaleString()}</small></div>
              {c.user_id === CURRENT_USER && (
                <button
                  onClick={() => handleDelete(c.a_id, c.index)}
                  style={{ marginTop: "6px", padding: "4px 8px", background: "crimson", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
                >
                  刪除
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
