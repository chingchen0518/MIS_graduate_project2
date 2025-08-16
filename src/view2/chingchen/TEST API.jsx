import React, { useState } from "react";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: 'AIzaSyCwl0J0v-7AUXevBNQZZEnwVIiq-dndFV4' });

const prompt = `請推薦一份台北一日遊行程，並以如下格式輸出：\n1. 景點名稱\n2. 兩個景點之間的交通時間\n3. 景點的類別（如文藝、古跡、休閑）\n請直接依照此格式列出多個景點與交通時間，不要有多餘說明。`;

const RecommendTrip = () => {
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setResponse("");
    try {
      const res = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      setResponse(res.text || JSON.stringify(res));
    } catch (err) {
      setResponse("Error: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: 24, border: "1px solid #ccc", borderRadius: 8 }}>
      <h2>台北一日遊推薦行程</h2>
      <button onClick={handleGenerate} disabled={loading} style={{ padding: "10px 24px", fontSize: 16 }}>
        {loading ? "生成中..." : "一鍵生成行程"}
      </button>
      <div style={{ marginTop: 32, minHeight: 60, whiteSpace: "pre-wrap", fontFamily: 'inherit' }}>
        {response}
      </div>
    </div>
  );
};

export default RecommendTrip;
