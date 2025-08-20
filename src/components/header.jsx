import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './header.css';

function Header() {
  const user = JSON.parse(localStorage.getItem('user'));
  const trip = JSON.parse(localStorage.getItem('trip')) || {};
  const navigate = useNavigate();
  const [stage, setStage] = useState(1);
  const [deadline, setDeadline] = useState('');
  const [days, setDays] = useState(0);
  const [finishedDay, setFinishedDay] = useState(0);
  const [now, setNow] = useState(new Date());
  const [hasUpdated, setHasUpdated] = useState(false); // ✅ 只更新一次

  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const [tripId, setTripId] = useState(trip.tid || 1);//之後要修改
  const [tripTitle, setTripTitle] = useState(trip.title);


  const stepNames = ['行程背景', '選擇景點', '建議行程', '行程比較', '行程確定'];

  const mapStageToNumber = (stage) => {
    const stageOrder = { A: 1, B: 2, C: 3, D: 4, E: 5 };
    return stageOrder[stage] || 1;
  };

//   const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        // console.log('已登入使用者：', user.name, '，ID:', user.id);
    } else {
        // console.log('尚未登入');
    }


  const pad = (n) => (n < 10 ? '0' + n : n);

  // 每秒更新 now
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 取得旅程資料
  const fetchTripData = async () => {
    try {
      const res = await fetch(`/api/trip/${tripId}`);
      const data = await res.json();

      setTripId(data.tripId);
      setTripTitle(data.tripTitle);
      setStage(mapStageToNumber(data.stage));
      setDeadline(data.deadline);
      setDays(data.days);
      setFinishedDay(data.finished_day);
      setHasUpdated(false); // 重置 flag
    } catch (e) {
      console.error('API 錯誤:', e);
    }
  };

  useEffect(() => {
    fetchTripData();
  }, []);

  const getCountdown = () => {
    if (stage === 5) return '00:00:00'; // 如果已到 E 階段，剩餘時間固定為 0
    if (!deadline) return '00:00:00';
    const diff = Math.max(0, Math.floor((new Date(deadline) - now) / 1000));
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  // 倒數到 0 時只執行一次
  useEffect(() => {
    if (!deadline || hasUpdated) return;

    const diff = Math.floor((new Date(deadline) - now) / 1000);
    if (diff <= 0) {
      const updateStageDate = async () => {
        try {
          const nowDateTime = new Date();
          const stage_date = `${nowDateTime.getFullYear()}-${pad(
            nowDateTime.getMonth() + 1
          )}-${pad(nowDateTime.getDate())} ${pad(nowDateTime.getHours())}:${pad(
            nowDateTime.getMinutes()
          )}:${pad(nowDateTime.getSeconds())}`;

          const res = await fetch('/api/update-stage-date', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tripId,
              stage_date: deadline, // 用 deadline 代替 stage_date
              days,                // 傳入天數
              finishedDay          // 傳入已完成天數
            }),
          });

          const result = await res.json();
          console.log('更新 stage_date:', result);

          fetchTripData(); // 重新抓最新資料
          setHasUpdated(true); // ✅ 標記已更新
        } catch (err) {
          console.error('更新 stage_date 失敗:', err);
        }
      };
      updateStageDate();
    }
  }, [now, deadline, hasUpdated, tripId]);

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
        <a href="http://localhost:5173/"><img src="img/logo.jpg" className="header-icon-img" alt="logo" /></a>
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
          <div key={index} className={`step${index + 1 === stage ? ' active' : ''}`}>
            {step}
          </div>
        ))}
      </div>
      <div className="header-icon">
        <img src="img/logo.jpg" className="header-icon-img" alt="logo" />
      </div>
      {/* <div className="header-icon">
        <button
          className="header-icon-btn"
          style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}
          onClick={() => navigate('/Profile')}
        >
          <img src={`/img/avatar/${user.img}`} className="header-icon-img" alt="logo" />
        </button>
      </div> */}


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