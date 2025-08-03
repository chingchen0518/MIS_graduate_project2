import './header.css';

function Header() {
  const tripTitle = '小明的尋寶之旅';
  const stepNames = ['行程背景', '選擇景點', '建議行程', '行程比較', '行程確定'];

  return (
    <div className="header-container">
      <div className="header-icon">
        <img src="img/logo.jpg" className="header-icon-img" alt="logo" />
      </div>
      <div className="header-title-block">
        <span className="header-title">{tripTitle}</span>
        <span className="header-timer">
          <span className="header-timer-icon">⏳</span>
          時間倒數: <span>00:00:00</span>
        </span>
        <button className="share-button">
          分享旅程
        </button>
      </div>
      <div className="flow-steps">
        {stepNames.map((step, index) => (
          <div
            key={index}
            className={`step${index + 1 === 4 ? ' active' : ''}`}
          >
            {step}
          </div>
        ))}
      </div>
      <div className="header-icon">
        <img src="img/logo.jpg" className="header-icon-img" alt="logo" />
      </div>
    </div>
  );
}

export default Header;
