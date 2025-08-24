import React, { useState } from "react";
import axios from "axios";

export default function AddComment() {
  const [form, setForm] = useState({
    t_id: 1,      // 預設固定為 1
    a_id: "",
    user_id: "chyi12",
    content: "",
    link: ""      // ⭐ 新增 link 欄位
  });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:3001/api/comments-add", form);
      setMessage(res.data.message || "新增成功");
      setForm((prev) => ({ ...prev, a_id: "", content: "", link: "" })); // 送出後清空輸入
    } catch (err) {
      console.error(err);
      setMessage("❌ 新增失敗：" + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "20px auto", fontFamily: "Arial" }}>
      <h2>新增評論測試 (固定 t_id=1)</h2>
      <form onSubmit={handleSubmit}>
        <label>
          a_id：
          <input type="number" name="a_id" value={form.a_id} onChange={handleChange} required />
        </label>
        <br /><br />
        <label>
          user_id：
          <input type="text" name="user_id" value={form.user_id} onChange={handleChange} required />
        </label>
        <br /><br />
        <label>
          content：
          <textarea name="content" value={form.content} onChange={handleChange} required />
        </label>
        <br /><br />
        <label>
          link (選填)：
          <input type="url" name="link" value={form.link} onChange={handleChange} placeholder="https://example.com" />
        </label>
        <br /><br />
        <button type="submit">送出</button>
      </form>
      {message && <p style={{ marginTop: "10px" }}>{message}</p>}
    </div>
  );
}
