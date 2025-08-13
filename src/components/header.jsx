import { useEffect, useState } from 'react';
import './header.css';

function Header() {
  const [stage, setStage] = useState(1);
  const [deadline, setDeadline] = useState(new Date());
  const [now, setNow] = useState(new Date());

  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');

  const [tripId, setTripId] = useState(2); // 預設值
  const [tripTitle, setTripTitle] = useState('');

  // A~E 對應成 1~5
  const mapStageToNumber = (stage) => {
    const stageOrder = { A: 1, B: 2, C: 3, D: 4, E: 5 };
    return stageOrder[stage] || 1;
  };

  // 每秒更新 now，讓倒數計時動起來
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/trip/1');
        const data = await res.json();

        console.log('stage_date:', data.stage_date);
        console.log('time:', data.time);

        setTripId(data.tripId);
        setTripTitle(data.tripTitle);
        setStage(mapStageToNumber(data.stage));

        // ✅ 將 stage_date 與 time 合成本地時間（台灣時間）
        const stageDate = new Date(data.stage_date); // stage_date 本身就是台灣時間
        const [hours, minutes, seconds] = data.time.split(':').map(Number);

        const stageDateTime = new Date(
          stageDate.getFullYear(),
          stageDate.getMonth(),
          stageDate.getDate(),
          hours,
          minutes,
          seconds
        );

        setDeadline(stageDateTime);
        console.log('deadline:', stageDateTime);

      } catch (e) {
        console.error('API 錯誤:', e);
      }
    })();
  }, []);

  const pad = (n) => (n < 10 ? '0' + n : n);

  const getCountdown = () => {
    const diff = Math.max(0, Math.floor((deadline - now) / 1000));
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  const stepNames = ['行程背景', '選擇景點', '建議行程', '行程比較', '行程確定'];

  const handleSendEmail = async () => {
    try {
      const res = await fetch('/api/share-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tripId, tripTitle }),
      });
      const result = await res.json();
      alert(result.message);
      setShowModal(false);
      setEmail('');
    } catch (err) {
      alert('發送失敗，請稍後再試');
      console.error(err);
    }
  };

  return (
    <div className="header-container">
      <div className="header-icon">
        <img src="img/logo.jpg" className="header-icon-img" alt="logo" />
      </div>
      <div className="header-title-block">
        <span className="header-title">{tripTitle}</span>
        <span className="header-timer">
          <span className="header-timer-icon">⏳</span>
          時間倒數: <span>{getCountdown()}</span>
        </span>
        <button className="share-button" onClick={() => setShowModal(true)}>
          分享旅程
        </button>
      </div>
      <div className="flow-steps">
        {stepNames.map((step, index) => (
          <div
            key={index}
            className={`step${index + 1 === stage ? ' active' : ''}`}
          >
            {step}
          </div>
        ))}
      </div>
      <div className="header-icon">
        <img src="img/logo.jpg" className="header-icon-img" alt="logo" />
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>輸入對方的 Gmail</h3>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@gmail.com"
              required
            />
            <div className="modal-buttons">
              <button onClick={handleSendEmail}>發送邀請</button>
              <button onClick={() => setShowModal(false)}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Header;
