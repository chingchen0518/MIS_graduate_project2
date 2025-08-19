import React from 'react';
import './homepage.css';

const HomePage = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const trip = JSON.parse(localStorage.getItem('trip'));
    if (user) {
        console.log('已登入使用者：', user.name, ',ID:', user.uid);
    } else {
        console.log('尚未登入');
    }
    if (trip) {
        console.log('已登入行程：', trip.title, ',stage:', trip.stage, ',開始日期:', trip.s_date);
    } else {
        console.log('尚未參與行程');
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
        <li className="homepage_li"><a href="/page2">page2</a></li>
        <li className="homepage_li"><a href="/page3">page3</a></li>

        <li className="homepage_li"><a href="/part1">Part1</a></li>

        <li className="homepage_li"><a href="/TEST_API">Gemini Chat</a></li>

      </ul>
    </div>

  );
};

export default HomePage;
