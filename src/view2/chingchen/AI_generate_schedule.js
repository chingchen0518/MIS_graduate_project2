// function1:讀取所有景點資訊
const fetchAttractions = async () => {
    const res = await fetch("http://localhost:3001/api/view2_attraction_list");
    if (!res.ok) throw new Error("无法获取景点数据");
    return await res.json();
};

// function2:组装prompt，支持自定义时间与景点数
const buildPrompt = (full_attractions, { startTime = '08:00', endTime = '18:00', attraction_count = 6 } = {}) => {
    const arr = full_attractions.map(a => ({ a_id: a.a_id, name: a.name }));
    return (
    '# 角色\n你是一位專業的台灣旅遊行程規劃師。\n\n' +
    `# 任務\n根據我提供的台灣景點資訊陣列，請你規劃出一個最順暢的旅遊行程。\n` +
    `本次行程時間為 ${startTime} 到 ${endTime}，請安排約 ${attraction_count} 個景點，並考慮地理位置、交通便利性與流暢度。每個景點之間請預留合理交通時間，此外也要按照景點的性質建議一個最佳的停留時間。\n\n` +
    '# 輸入格式\n我會提供一個 JSON 陣列，每個物件都包含一個景點的 `a_id` (ID) 和 `name` (名稱)。\n\n' +
    '# 輸出格式要求\n你的回答**必須**是一個單獨的、格式正確的 JSON 陣列。\n- 陣列中的每個物件代表一個行程中的景點。\n- 每個物件都**必須**包含以下五個鍵(key)：\n  1. `a_id`: (字串) 來自輸入資料的景點 ID。\n  2. `name`: (字串) 來自輸入資料的景點名稱。\n  3. `sequence`: (數字) 代表景點在行程中的順序，從 1 開始。\n  4. `arrival_time`: (字串，24小時制) 抵達該景點的時間。\n  5. `stay_minutes`: (數字) 在該景點預計停留的分鐘數。\n\n' +
    '# 嚴格限制\n- **絕對不要**在 JSON 陣列前後添加任何說明文字、註解、標題或 ```json ``` 標籤。\n- 你的唯一輸出就是一個可以直接被程式解析的 JSON 陣列字串。\n\n' +
    '# 開始規劃\n請根據以下提供的景點資訊，推薦最適合的景點並安排順序：\n\n' +
    JSON.stringify(arr, null, 2)
    );
};


// function3:AI请求
async function scheduleGenerate(prompt,api_key=0) {
    // const all_AI_models=
    // [{api:'https://openrouter.ai/api/v1/chat/completions',mode:"openai/gpt-oss-20b:free",key:'Bearer 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'},
    // //  {api:'https://openrouter.ai/api/v1/chat/completions',mode:'deepseek/deepseek-r1-0528:free',key:''},
    
    //  {api:'https://openrouter.ai/api/v1/chat/completions',mode:'z-ai/glm-4.5-air:free',key:'Bearer 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'},
    // //  {api:'',mode:'',key:''},
    // //  {api:'',mode:'',key:''},
    // ]
    const all_key = [
        {name:'chingchen',key:'Bearer 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'},
        {name:'leechingchen',key:'Bearer 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'}
    ]

    const openrouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        "Authorization": all_key[api_key].key
        },
        body: JSON.stringify({
        // model: 'openai/gpt-oss-20b:free',
        // model: 'z-ai/glm-4.5-air:free',
        model: 'deepseek/deepseek-r1:free',
        messages: [
            { role: "system", content: "你是一位專業的台灣旅遊行程規劃師。" },
            { role: "user", content: prompt }
        ],
        temperature: 0.7
        })
    });
    const openrouterData = await openrouterRes.json();

    //回傳結果
    return openrouterData.choices?.[0]?.message?.content || JSON.stringify(openrouterData);
}

// const attractions = await fetchAttractions();
// const prompt = buildPrompt(attractions, { startTime: '09:00', endTime: '17:00', attraction_count: 7 });
// const originalResponse = await scheduleGenerate(prompt);

// console.log(originalResponse);

export { fetchAttractions, buildPrompt, scheduleGenerate };

// const handleGenerate = async () => {
//     setLoading(true);
//     setResponse("");
//     setElapsed(null);
//     const start = Date.now();
//     try {
//       // 先讀取資料庫內容
//       const attractions = await fetchAttractions();
//       // 組 prompt
//   // 這裡可根據UI傳入參數
//   const prompt = buildPrompt(attractions, { startTime: '09:00', endTime: '17:00', attraction_count: 7 });
//       // 呼叫AI
//       const text = await fetchAITripRecommendation(prompt);
//       setResponse(showRawAIResponse(text));
//       // 解析AI回傳的JSON結果
//       try {
//         // 提取第一個 [ ... ] 區塊
//         const match = text.match(/\[([\s\S]*?)\]/);
//         let arr = [];
//         if (match) {
//           arr = JSON.parse(match[0]);
//         } else {
//           arr = JSON.parse(text);
//         }
//         setAttractions(arr);
//         console.log('AI推薦行程:', arr);
//       } catch (e) {
//         console.warn('解析AI回傳行程失敗', e);
//       }
//     } catch (err) {
//       setResponse("Error: " + err.message);
//     }
//     setLoading(false);
//     setElapsed(((Date.now() - start) / 1000).toFixed(2));
//   };
  
// fetchAttractions().then(data => {
//     console.log(data);
// }).catch(error => {
//     console.error(error);
// });