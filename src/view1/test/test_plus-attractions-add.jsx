import React, { useState } from "react";
import axios from "axios";

export default function AddPlusAttraction() {
  const [form, setForm] = useState({
    t_id: 1,                // 預設 t_id = 1
    p_name_zh: "",
    p_name: "",
    p_category: "",
    p_address: "",
    p_city: "",
    p_country: "",
    p_budget: "",
    p_photo: "",
    user_id: "chyi12"       // 預設使用者代號
  });
  const [message, setMessage] = useState("");
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:3001/api/plus-attractions-add", form);
      setMessage(res.data.message || "新增成功");
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setMessage("❌ 新增失敗：" + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div style={{ maxWidth: "500px", margin: "20px auto", fontFamily: "Arial" }}>
      <h2>➕ 手動新增景點</h2>
      <form onSubmit={handleSubmit}>
        <label>
          中文名稱：
          <input type="text" name="p_name_zh" value={form.p_name_zh} onChange={handleChange} required />
        </label>
        <br /><br />
        <label>
          英文名稱：
          <input type="text" name="p_name" value={form.p_name} onChange={handleChange} />
        </label>
        <br /><br />
        <label>
          類別：
          <input type="text" name="p_category" value={form.p_category} onChange={handleChange} />
        </label>
        <br /><br />
        <label>
          地址：
          <input type="text" name="p_address" value={form.p_address} onChange={handleChange} />
        </label>
        <br /><br />
        <label>
          城市：
          <input type="text" name="p_city" value={form.p_city} onChange={handleChange} />
        </label>
        <br /><br />
        <label>
          國家：
          <input type="text" name="p_country" value={form.p_country} onChange={handleChange} />
        </label>
        <br /><br />
        <label>
          預算：
          <input type="number" name="p_budget" value={form.p_budget} onChange={handleChange} />
        </label>
        <br /><br />
        <label>
          照片 URL：
          <input type="text" name="p_photo" value={form.p_photo} onChange={handleChange} />
        </label>
        <br /><br />
        <button type="submit">送出</button>
      </form>

      {message && <p style={{ marginTop: "10px" }}>{message}</p>}

      {result && result.success && (
        <div style={{ marginTop: "20px", padding: "10px", border: "1px solid #ccc" }}>
          <h3>✅ 新增結果</h3>
          <p><b>PlusAttraction：</b> {result.plus.p_name_zh} ({result.plus.p_name})</p>
          <p><b>ReAttraction：</b> a_id = {result.re.a_id}, 初始 vote_like = {result.re.vote_like}</p>
        </div>
      )}
    </div>
  );
}
