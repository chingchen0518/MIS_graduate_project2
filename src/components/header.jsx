import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './header.css';
import StageModal from './StageModal';
import CountdownTimer from './CountdownTimer';
import ShowTimeModal from './ShowTimeModal';


function Header() {
  const user = JSON.parse(localStorage.getItem('user'));
  const trip = JSON.parse(localStorage.getItem('trip')) || {};
  const navigate = useNavigate();
  const [stage, setStage] = useState(1);
  const [deadline, setDeadline] = useState('');
  const [days, setDays] = useState(0);
  const [finishedDay, setFinishedDay] = useState(0);
  const [creatorUid, setCreatorUid] = useState(null);
  const [time, setTime] = useState(0);
  const [stage_date, setStageDate] = useState('');
  const [now, setNow] = useState(new Date());
  const [hasUpdated, setHasUpdated] = useState(false); // ✅ 只更新一次

  const [showStageModal, setShowStageModal] = useState(false);
  const [nextStageName, setNextStageName] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);

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
      setCreatorUid(data.creatorUid);
      setTime(data.time);
      setStageDate(data.stage_date);
      setHasUpdated(false); // 重置 flag
    } catch (e) {
      console.error('API 錯誤:', e);
    }
  };

  useEffect(() => {
    fetchTripData();
  }, []);

  // 倒數到 0 時只執行一次
  useEffect(() => {
    if (!deadline || hasUpdated) return;

    const diff = Math.floor((new Date(deadline) - now) / 1000);
    if (diff <= 0 && stage < 5) {
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
          window.dispatchEvent(new Event('stageUpdated'));
          console.log('更新 stage_date:', result);
          const updatedStageNum = mapStageToNumber(result.stage);
          setNextStageName(stepNames[updatedStageNum - 1]); // 例如 "行程確定"
          setShowStageModal(true);            // 顯示彈窗

          fetchTripData(); // 重新抓最新資料
          setHasUpdated(true); // ✅ 標記已更新
        } catch (err) {
          console.error('更新 stage_date 失敗:', err);
        }
      };
      updateStageDate();
    }
  }, [now, deadline, hasUpdated, tripId, stage]);

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
      {showStageModal && (
        <StageModal
          nextStage={nextStageName}
          onClose={() => setShowStageModal(false)}
        />
      )}
      <div className="header-icon">
        <a href="http://localhost:5173/"><img src="img/logo.jpg" className="header-icon-img" alt="logo" /></a>
      </div>
      <div className="header-title-block">
        <span className="header-title">{tripTitle}</span>
        <span className="header-timer">
          <span className="header-timer-icon">
            {user?.uid === creatorUid ? (
              <button
                className="header-gear-btn"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.2em',
                  padding: 0,
                }}
                onClick={() => setShowTimeModal(true)}
                title="查看目前時間設定"
              >
                ⚙️
              </button>
            ) : (
              '⏳'
            )}
            {showTimeModal && (
              <ShowTimeModal
                tripId={tripId}
                stage_date={stage_date}
                deadline={deadline}
                time={time}
                onClose={(shouldRefresh) => {
                  setShowTimeModal(false);
                  if (shouldRefresh) fetchTripData(); // 儲存後刷新 header
                }}
              />
            )}
          </span>
          時間倒數: <CountdownTimer deadline={deadline} stage={stage} />
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