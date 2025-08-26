import React, { useState, useMemo, useRef, useEffect } from 'react';
import axios from 'axios';
import './part1.css';

const CELL_PX  = 120;
const MIN_LEN  = 1;
const genUid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

/* ---------- 工具：把同名且相鄰的方塊合併 ---------- */
function mergeBlocks(blocks) {
  const sorted = [...blocks].sort((a, b) => a.startIndex - b.startIndex);
  const merged = [];
  sorted.forEach((b) => {
    const last = merged[merged.length - 1];
    if (last && last.name === b.name && last.startIndex + last.length === b.startIndex) {
      last.length += b.length;
    } else {
      merged.push({ ...b });
    }
  });
  return merged;
}

/* ---------- 飯店選擇 (原 choose_hotel.jsx) ---------- */
function TravelGantt({ onDataChange = () => {} }) {
  const [arrivalDate, setArrivalDate]     = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [query,        setQuery]          = useState("");
  const [resultList,   setResultList]     = useState([]);
  const [blocks,       setBlocks]         = useState([]);

  useEffect(() => {
    onDataChange({ arrivalDate, departureDate, query, resultList, blocks });
  }, [arrivalDate, departureDate, query, resultList, blocks, onDataChange]);

  const days = useMemo(() => {
    if (!arrivalDate || !departureDate) return [];
    const s = new Date(arrivalDate);
    const e = new Date(departureDate);
    const diff = Math.max(0, Math.ceil((e - s) / 86_400_000));
    return Array.from({ length: diff }, (_, i) => {
      const d = new Date(s);
      d.setDate(s.getDate() + i);
      return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
    });
  }, [arrivalDate, departureDate]);

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

  const groupedDays = [];
  for (let i = 0; i < days.length; i += 7) {
    groupedDays.push(days.slice(i, i + 7));
  }

  return (
    <div>
      <div className="form-group">
        <label>抵達時間：</label>
        <input type="date" value={arrivalDate} onChange={(e) => setArrivalDate(e.target.value)} />
        <label>離開時間：</label>
        <input type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} />
      </div>

      <div className="form-group">
        <label>加入飯店：</label>
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} />
        <button onClick={searchHotel}>搜尋</button>
      </div>

      {resultList.length > 0 && (
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
      )}

      {days.length > 0 && (
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
                      .map((b) => (
                        <div key={b.uid} className="block" style={{ width: `${b.length * CELL_PX}px` }}>
                          {b.name}
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Part1 主程式 ---------- */
const Part1 = ({ onNext }) => {
  const [selectedCountry, setSelectedCountry] = useState('');
  const [message, setMessage] = useState('');
  const [tripName, setTripName] = useState('');
  const [ganttData, setGanttData] = useState({
    arrivalDate: "",
    departureDate: "",
    query: "",
    resultList: [],
    blocks: [],
  });

  const handleSubmit = async () => {
    try {
      const res = await axios.post('http://localhost:3001/api/a', {
        country: selectedCountry,
        title: tripName,
        arrivalDate: ganttData.arrivalDate,
        departureDate: ganttData.departureDate,
        hotels: [...new Set(ganttData.blocks.map(b => b.name))],
      });

      const { success, tripId } = res.data;
      if (!success) throw new Error('儲存失敗');

      onNext({ tripId, country: selectedCountry });
    } catch (error) {
      console.error('Error in API request:', error);
      setMessage('Error saving to database.');
    }
  };

  return (
    <div className="container">
      <h1>旅遊資料填寫</h1>

      <div className="form-group">
        <label>旅程名稱：</label>
        <input type="text" value={tripName} onChange={(e) => setTripName(e.target.value)} />
      </div>

      <div className="form-group">
        <label>旅遊國家：</label>
        <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)}>
          <option value="">-- 請選擇 --</option>
          <option value="Taiwan">台灣</option>
          <option value="Switzerland">瑞士</option>
          <option value="Japan">日本</option>
        </select>
      </div>

      <TravelGantt onDataChange={setGanttData} />

      <button onClick={handleSubmit} className="next-btn">下一步</button>
      <p>{message}</p>
    </div>
  );
};

export default Part1;