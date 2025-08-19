
import React, { useState } from "react";

const TEST_API_GPT = () => {
    const [response, setResponse] = useState("");
    const [loading, setLoading] = useState(false);
    const [elapsed, setElapsed] = useState(null);
    const [attractions, setAttractions] = useState([]);

    const [attr, setAttr] = useState([]);

    // 获取景点列表
    const fetchAttractions = async () => {
        const res = await fetch("http://localhost:3001/api/view2_attraction_list");
        if (!res.ok) throw new Error("无法获取景点数据");
        return await res.json();
    };

    
    // 组装prompt，支持自定义时间与景点数
    const buildPrompt = (attractions, { startTime = '08:00', endTime = '18:00', attraction_count = 6 } = {}) => {
        const arr = attractions.map(a => ({ a_id: a.a_id, name: a.name }));
        return (
        '# 角色\n你是一位專業的台灣旅遊行程規劃師。\n\n' +
        `# 任務\n根據我提供的台灣景點資訊陣列，請你規劃出一個最順暢的旅遊行程。\n` +
        `本次行程時間為 ${startTime} 到 ${endTime}，請安排約 ${attraction_count} 個景點，並考慮地理位置、交通便利性與流暢度。每個景點之間請預留合理交通時間。\n\n` +
        '# 輸入格式\n我會提供一個 JSON 陣列，每個物件都包含一個景點的 `a_id` (ID) 和 `name` (名稱)。\n\n' +
        '# 輸出格式要求\n你的回答**必須**是一個單獨的、格式正確的 JSON 陣列。\n- 陣列中的每個物件代表一個行程中的景點。\n- 每個物件都**必須**包含以下五個鍵(key)：\n  1. `a_id`: (字串) 來自輸入資料的景點 ID。\n  2. `name`: (字串) 來自輸入資料的景點名稱。\n  3. `sequence`: (數字) 代表景點在行程中的順序，從 1 開始。\n  4. `arrival_time`: (字串，24小時制) 抵達該景點的時間。\n  5. `stay_minutes`: (數字) 在該景點預計停留的分鐘數。\n\n' +
        '# 嚴格限制\n- **絕對不要**在 JSON 陣列前後添加任何說明文字、註解、標題或 ```json ``` 標籤。\n- 你的唯一輸出就是一個可以直接被程式解析的 JSON 陣列字串。\n\n' +
        '# 開始規劃\n請根據以下提供的景點資訊，推薦最適合的景點並安排順序：\n\n' +
        JSON.stringify(arr, null, 2)
        );
    };

  // 封装AI请求为独立函数
  async function fetchAITripRecommendation(prompt) {
    const openrouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer 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",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b:free",
        messages: [
          { role: "system", content: "你是一位專業的台灣旅遊行程規劃師。" },
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      })
    });
    const openrouterData = await openrouterRes.json();
    return openrouterData.choices?.[0]?.message?.content || JSON.stringify(openrouterData);
  }

// =============================================================================================

  // 直接显示AI回传的原始内容
  const showRawAIResponse = (text) => text;

  const handleGenerate = async () => {
    setLoading(true);
    setResponse("");
    setElapsed(null);
    const start = Date.now();
    try {
      // 先讀取資料庫內容
      const attractions = await fetchAttractions();
      // 組 prompt
  // 這裡可根據UI傳入參數
  const prompt = buildPrompt(attractions, { startTime: '09:00', endTime: '17:00', attraction_count: 7 });
      // 呼叫AI
      const text = await fetchAITripRecommendation(prompt);
      setResponse(showRawAIResponse(text));
      // 解析AI回傳的JSON結果
      try {
        // 提取第一個 [ ... ] 區塊
        const match = text.match(/\[([\s\S]*?)\]/);
        let arr = [];
        if (match) {
          arr = JSON.parse(match[0]);
        } else {
          arr = JSON.parse(text);
        }
        setAttractions(arr);
        console.log('AI推薦行程:', arr);
      } catch (e) {
        console.warn('解析AI回傳行程失敗', e);
      }
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

export default TEST_API_GPT;
