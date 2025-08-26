import React, { useState } from "react";
import axios from "axios";

export default function SearchAttractions() {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState("");

  // 搜尋景點
  const handleSearch = async () => {
    try {
      const res = await axios.get("http://localhost:3001/api/attractions-search", {
        params: { keyword }
      });
      setResults(res.data);
    } catch (err) {
      console.error(err);
      setMessage("❌ 搜尋失敗：" + err.message);
    }
  };

  // 加入 ReAttraction
  const handleAdd = async (a_id) => {
    try {
      const res = await axios.post("http://localhost:3001/api/reAttractions-add", {
        t_id: 1,               // 預設行程
        a_id: a_id,            // 選到的景點
        user_id: "chyi12"      // 使用者
      });
      setMessage(res.data.message || "新增成功");
    } catch (err) {
      console.error(err);
      setMessage("❌ 加入失敗：" + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "20px auto", fontFamily: "Arial" }}>
      <h2>🔍 搜尋景點並加入行程 (t_id=1)</h2>
      <input
        type="text"
        placeholder="輸入景點名稱或中文名稱"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        style={{ width: "70%", padding: "6px" }}
      />
      <button onClick={handleSearch} style={{ marginLeft: "10px" }}>
        搜尋
      </button>

      {message && <p style={{ marginTop: "10px", color: "green" }}>{message}</p>}

      <ul style={{ marginTop: "20px", padding: 0, listStyle: "none" }}>
        {results.map((r) => (
          <li key={r.a_id} style={{ marginBottom: "10px", borderBottom: "1px solid #ddd", paddingBottom: "10px" }}>
            <strong>{r.name_zh || r.name}</strong> ({r.category || "無分類"})
            <br />
            <button onClick={() => handleAdd(r.a_id)} style={{ marginTop: "5px" }}>
              ➕ 加入 ReAttraction
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}