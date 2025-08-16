import React from 'react';
import './homepage.css';

const HomePage = () => {
  const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        console.log('已登入使用者：', user.name, '，ID:', user.id);
    } else {
        console.log('尚未登入');
    }
  return (

    <div id ="home_page" style={{ paddingLeft: '20px' }}>
      <ul>
        <li className="homepage_li"><a href="/attraction">attraction</a></li>
        <li className="homepage_li"><a href="/page1">page1</a></li>
        <li className="homepage_li"><a href="/map">map</a></li>
        <li className="homepage_li"><a href="/MapDisplay">MapDisplay</a></li>
        <li className="homepage_li"><a href="/header">header</a></li>
        <li className="homepage_li"><a href="/login">login</a></li>
        <li className="homepage_li"><a href="/logout">logout</a></li>
        <li className="homepage_li"><a href="/signin">signin</a></li>
        <li className="homepage_li"><a href="/forgotPassword">forgotPassword</a></li>
        <li className="homepage_li"><a href="/Profile">Profile</a></li>
        <li className="homepage_li"><a href="/ResizableBox">ResizableBox</a></li>
        <li className="homepage_li"><a href="/MyRndList">MyRndList</a></li>
        <li className="homepage_li"><a href="/MyRndList">page2</a></li>
      </ul>
    </div>

  );
};

export default HomePage;
