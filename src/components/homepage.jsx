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

    <div id ="home_page">
      <ul>
        <li class="homepage_li"><a href="/attraction">attraction</a></li>
        <li class="homepage_li"><a href="/page1">page1</a></li>
        <li class="homepage_li"><a href="/map">map</a></li>
        <li class="homepage_li"><a href="/MapDisplay">MapDisplay</a></li>
        <li class="homepage_li"><a href="/header">header</a></li>
        <li class="homepage_li"><a href="/login">login</a></li>
        <li class="homepage_li"><a href="/logout">logout</a></li>
        <li class="homepage_li"><a href="/signin">signin</a></li>
        <li class="homepage_li"><a href="/forgotPassword">forgotPassword</a></li>
        <li class="homepage_li"><a href="/Profile">Profile</a></li>
      </ul>
    </div>

  );
};

export default HomePage;
