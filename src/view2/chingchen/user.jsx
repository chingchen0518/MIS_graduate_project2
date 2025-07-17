import React from "react";

const UserProfile = ({ userName, loginTime }) => {

  const cardStyle = {
    border: '1px solid #ccc',
    padding: '20px',
    margin: '20px',
  };

  
  return (
    <div style={cardStyle}>
      <h2>使用者資訊卡</h2>
      <p><strong>使用者名稱：</strong> {userName}</p>
      <p><strong>登入時間 (UTC)：</strong> {loginTime}</p>
    </div>
  );
};

export default UserProfile;
