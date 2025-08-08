import React, {
  useState,
  useMemo,
  useRef,
  useEffect      // ← 把 useEffect 加進來
} from "react";

import axios from "axios";
import "./s.css";

const CELL_PX  = 120;
const HANDLE_W = 10;
const MIN_LEN  = 1;
const genUid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

/* ---------- 工具：把同名且相鄰的方塊合併 ---------- */
function mergeBlocks(blocks) {
  const sorted = [...blocks].sort((a, b) => a.startIndex - b.startIndex);
  const merged = [];
  sorted.forEach((b) => {
    const last = merged[merged.length - 1];
    if (
      last &&
      last.name === b.name &&
      last.startIndex + last.length === b.startIndex
    ) {
      // 直接銜接
      last.length += b.length;
    } else {
      merged.push({ ...b });
    }
  });
  return merged;
}

export default function TravelGantt({ onDataChange = () => {} }) { 
  const [arrivalDate, setArrivalDate]     = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [query,        setQuery]          = useState("");
  const [resultList,   setResultList]     = useState([]);
  const [blocks,       setBlocks]         = useState([]);

  /* 👉 只要重點狀態變動就回報給父層 */
  useEffect(() => {
    onDataChange({ arrivalDate, departureDate, query, resultList, blocks });
  }, [arrivalDate, departureDate, query, resultList, blocks, onDataChange]);

  /* ---------- 日期陣列 ---------- */
  const days = useMemo(() => {
    if (!arrivalDate || !departureDate) return [];
    const s = new Date(arrivalDate);
    const e = new Date(departureDate);
    const diff = Math.max(0, Math.ceil((e - s) / 86_400_000)); // 不含離開日
    return Array.from({ length: diff }, (_, i) => {
      const d = new Date(s);
      d.setDate(s.getDate() + i);
      return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(
        d.getDate()
      ).padStart(2, "0")}`;
    });
  }, [arrivalDate, departureDate]);

  /* ---------- 搜尋 ---------- */
  const searchHotel = async () => {
    if (!query.trim()) return;
    try {
      const { data } = await axios.get(
        `http://localhost:3001/api/hotels?query=${encodeURIComponent(query)}`
      );
      setResultList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ 搜尋失敗：", err);
    }
  };

  /* ---------- 拖進甘特圖 ---------- */
  const handleDrop = (e, dayIdx) => {
    e.preventDefault();
    const hotel = JSON.parse(e.dataTransfer.getData("hotel"));
    setBlocks((prev) =>
      mergeBlocks([
        ...prev.filter(
          (b) => !(dayIdx >= b.startIndex && dayIdx <= b.startIndex + b.length - 1)
        ),
        { ...hotel, uid: genUid(), startIndex: dayIdx, length: 1 },
      ])
    );
  };

  /* ---------- 拉伸 ---------- */
  const resizing = useRef(null); // { startX, uid, side }

  const onMouseMove = (e) => {
    if (!resizing.current) return;
    const { startX, uid, side } = resizing.current;
    const deltaDays = Math.round((e.clientX - startX) / CELL_PX);
    if (deltaDays === 0) return;

    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.uid === uid);
      if (idx === -1) return prev;
      /* 一、更新被拉伸區塊 */
      const next = prev.map((b, i) => {
        if (i !== idx) return b;
        let { startIndex, length } = b;
        if (side === "right") {
          let newEnd = startIndex + length - 1 + deltaDays;
          newEnd = Math.max(startIndex, Math.min(newEnd, days.length - 1));
          length = newEnd - startIndex + 1;
        } else {
          const newStart  = startIndex + deltaDays;
          const newLength = length - deltaDays;
          if (newStart < 0 || newLength < MIN_LEN) return b;
          startIndex = newStart;
          length     = Math.min(newLength, days.length - startIndex);
        }
        return { ...b, startIndex, length };
      });

      const moved = next[idx];
      const mS    = moved.startIndex;
      const mE    = moved.startIndex + moved.length - 1;

      /* 二、去除與 moved 重疊的其他塊 */
      const cleaned = [];
      next.forEach((b, i) => {
        if (i === idx) { cleaned.push(b); return; }
        const bS = b.startIndex;
        const bE = b.startIndex + b.length - 1;

        if (bE < mS || bS > mE) { cleaned.push(b); return; }

        // 部分重疊 → 留殘段
        if (bS < mS && bE >= mS) {
          const newLen = mS - bS;
          if (newLen >= MIN_LEN) cleaned.push({ ...b, length: newLen });
        } else if (bE > mE && bS <= mE) {
          const newStart = mE + 1;
          const newLen   = bE - newStart + 1;
          if (newLen >= MIN_LEN) cleaned.push({ ...b, startIndex: newStart, length: newLen });
        }
        // moved 在中間 fully 覆蓋 b → b 被吃掉
      });

      /* 三、最後再做一次合併 */
      return mergeBlocks(cleaned);
    });

    resizing.current.startX = e.clientX;
  };
  const stopResize = () => (resizing.current = null);

  const groupedDays = [];
    for (let i = 0; i < days.length; i += 7) {
      groupedDays.push(days.slice(i, i + 7));
    }


  /* ---------- 畫面 ---------- */
  return (
    <div
      onMouseMove={onMouseMove}
      onMouseUp={stopResize}
      onMouseLeave={stopResize}
    >
      {/* 日期選擇 */}
      <div className="form-group">
        <label>抵達時間：</label>
        <input type="date" value={arrivalDate} onChange={(e) => setArrivalDate(e.target.value)} />
        
        <label>離開時間：</label>
        <input type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} />
      </div>

      {/* 搜尋列 */}
      <div className="form-group">
        <label>加入飯店：</label>

        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} />
        <button onClick={searchHotel}>搜尋</button>

      </div>

      {/* 搜尋結果 */}
      {resultList.length > 0 && (
        <div style={{ maxWidth: "100%", overflowX: "auto" }}>
          <div className="result-box">
            {resultList.map((h, i) => (
              <div
                key={`h-${i}`}
                className="result-item"
                draggable
                onDragStart={(e) => e.dataTransfer.setData("hotel", JSON.stringify(h))}
              >
                {h.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 甘特圖 */}
      
      {days.length > 0 && (
        <>
          <div className="gantt-container">
            {groupedDays.map((weekDays, weekIdx) => (
              <div key={weekIdx} className="gantt-row">
                <div className="date-row">
                  {weekDays.map((d, i) => (
                    <div key={i} className="date-cell">{d}</div>
                  ))}
                </div>
                <div className="hotel-row">
                  {weekDays.map((d, i) => (
                    <div
                      key={i}
                      className="hotel-cell"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDrop(e, weekIdx * 7 + i)}
                    >
                      {blocks
                        .filter((b) => b.startIndex === weekIdx * 7 + i)
                        .map((b) => {
                          const isRightEdge = b.startIndex + b.length === days.length;
                          return (
                            <div
                              key={b.uid}
                              className="block"
                              style={{
                                width: `${b.length * CELL_PX}px`,
                              }}
                            >
                              {b.name}
                              {/* resize 邊不變 */}
                            </div>
                          );
                        })}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>


        </>
      )}
    </div>
  );
}