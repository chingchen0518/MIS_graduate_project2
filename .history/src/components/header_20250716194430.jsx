import { useEffect, useState } from 'react';
import './header.css';

export default function Header() {
  const [stage, setStage] = useState(1);
  const [deadline, setDeadline] = useState(new Date('2025-07-16T19:40:00'));
  const [now, setNow] = useState(new Date());

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

  const formatTime = (date) => {
    return (
      date.getFullYear() +
      '-' + pad(date.getMonth() + 1) +
      '-' + pad(date.getDate()) +
      ' ' + pad(date.getHours()) +
      ':' + pad(date.getMinutes()) +
      ':' + pad(date.getSeconds())
    );
  };

  const getCountdown = () => {
    const diff = Math.max(0, Math.floor((deadline - now) / 1000));
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  const stepNames = ['行程背景', '選擇景點', '建議行程', '行程比較', '行程確定'];

  return (
    <div className="treasure-hunt-wrapper">

      <div className="header-container">
        <div className="header-icon">
          <img src="logo.jpg" className="header-icon-img" alt="logo" />
        </div>
        <div className="header-title-block">
          <span className="header-title">小明的尋寶之旅</span>
          <span className="header-timer">
            <span className="header-timer-icon">⏳</span>
            時間倒數: <span>{getCountdown()}</span>
          </span>
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
          <img src="user1.jpg" className="header-icon-img" alt="user" />
        </div>
      </div>

      <div>stage: {stage}</div>
      <div>截止時間: {formatTime(deadline)}</div>
      <div>現在的時間: {formatTime(now)}</div>
    </div>
  );
}