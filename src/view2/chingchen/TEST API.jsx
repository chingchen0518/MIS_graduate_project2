
import React, { useState } from "react";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: 'AIzaSyCwl0J0v-7AUXevBNQZZEnwVIiq-dndFV4' });

const RecommendTrip = () => {
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(null);

  // 获取景点列表
  const fetchAttractions = async () => {
    const res = await fetch("http://localhost:3001/api/view2_attraction_list");
    if (!res.ok) throw new Error("无法获取景点数据");
    return await res.json();
  };

  // 组装prompt，只让AI从所有景点中挑选5~8个适合一天行程的景点
  const buildPrompt = (attractions) => {
    const arr = attractions.map(a => ({ a_id: a.a_id, name: a.name }));
    return (
      '# 角色\n你是一位專業的台灣旅遊行程規劃師。\n\n' +
      '# 任務\n根據我提供的台灣景點資訊陣列，請你規劃出一天內最適合、最順暢的旅遊行程。你必須考慮地理位置的相近性、交通便利性與行程的流暢度，並且一天的行程請控制在5~8個景點之間。\n\n' +
      '# 輸入格式\n我會提供一個 JSON 陣列，每個物件都包含一個景點的 `a_id` (ID) 和 `name` (名稱)。\n\n' +
      '# 輸出格式要求\n你的回答**必須**是一個單獨的、格式正確的 JSON 陣列。\n- 陣列中的每個物件代表一個行程中的景點。\n- 每個物件都**必須**包含以下三個鍵(key)：\n  1. `a_id`: (字串) 來自輸入資料的景點 ID。\n  2. `name`: (字串) 來自輸入資料的景點名稱。\n  3. `sequence`: (數字) 代表景點在行程中的順序，從 1 開始。\n\n' +
      '# 嚴格限制\n- **絕對不要**在 JSON 陣列前後添加任何說明文字、註解、標題或 ```json ``` 標籤。\n- 你的唯一輸出就是一個可以直接被程式解析的 JSON 陣列字串。\n\n' +
      '# 開始規劃\n請根據以下提供的景點資訊，推薦一天內最適合的5~8個景點並安排順序：\n\n' +
      JSON.stringify(arr, null, 2)
    );
  };

  // 直接显示AI回传的原始内容
  const showRawAIResponse = (text) => text;

  const handleGenerate = async () => {
    setLoading(true);
    setResponse("");
    setElapsed(null);
    const start = Date.now();
    try {
      const attractions = await fetchAttractions();
      const prompt = buildPrompt(attractions);
      const res = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      const text = res.text || JSON.stringify(res);
  // 直接显示AI回传的原始内容
  setResponse(showRawAIResponse(text));
    } catch (err) {
      setResponse("Error: " + err.message);
    }
    setLoading(false);
    setElapsed(((Date.now() - start) / 1000).toFixed(2));
  };

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: 24, border: "1px solid #ccc", borderRadius: 8 }}>
      <h2>台北一日遊推薦行程</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={handleGenerate} disabled={loading} style={{ padding: "10px 24px", fontSize: 16 }}>
          {loading ? "生成中..." : "一鍵生成行程"}
        </button>
        {elapsed !== null && (
          <span style={{ color: '#888', fontSize: 15 }}>耗時: {elapsed} 秒</span>
        )}
      </div>
      <div style={{ marginTop: 32, minHeight: 60, fontFamily: 'inherit' }}>
        <pre style={{ background: '#f7f7f7', padding: 12, borderRadius: 6 }}>
          {response}
        </pre>
      </div>
    </div>
  );
};

export default RecommendTrip;
