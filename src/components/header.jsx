import { useEffect, useState } from 'react';
import './header.css';

function Header() {
  const [stage, setStage] = useState(1);
  const [deadline, setDeadline] = useState(new Date('2025-07-16T19:40:00'));
  const [now, setNow] = useState(new Date());

  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');

  // ⛳ 假設從某處取得旅程資料
  const tripId = 5; // ← 改成你實際的 tripId
  const tripTitle = '小明的尋寶之旅'; // ← 改成實際旅程標題

  useEffect(() => {
    const interval = setInterval(() => {
      const current = new Date();
      setNow(current);

      const diff = Math.max(0, Math.floor((deadline - current) / 1000));
      if (diff === 0 && stage < 5) {
        const nextStage = stage + 1;
        setStage(nextStage);

        const newDeadline = new Date(deadline.getTime() + 5000);
        setDeadline(newDeadline);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [stage, deadline]);

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
