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
        console.log('ID：', trip.tid,'已登入行程：', trip.title);
    } else {
        console.log('尚未參與行程');
    }
  return (

    <div id ="home_page" style={{ paddingLeft: '20px', display:'flex' }}>
        {/* view1的這里 */}      
        <ul className="view_1" style={{ margin: '20px',padding:'20px',border:'1px solid'}}>
            <li className="homepage_li"><a href="/part1">Part1</a></li>
            <li className="homepage_li"><a href="/treemap">Treemap_only</a></li>
            <li className="homepage_li"><a href="/choose">Choose Attraaction</a></li>
            <li className="homepage_li"><a href="/view1test">View1 Test</a></li>
        </ul>


        
         {/* view2的這里 */}
        <ul className="view_2" style={{ margin: '20px',padding:'20px',border:'1px solid'}}>
            <li className="homepage_li"><a href="/attraction">attraction</a></li>
            <li className="homepage_li blue"><a className="blue" href="/page1">⑤page1</a></li>
            <li className="homepage_li"><a href="/map">map</a></li>
            <li className="homepage_li"><a href="/MapDisplay">MapDisplay</a></li>
            <li className="homepage_li"><a href="/ResizableBox">ResizableBox</a></li>
            <li className="homepage_li"><a href="/MyRndList">MyRndList</a></li>
            <li className="homepage_li"><a href="/TEST_API">Gemini Chat</a></li>
            <li className="homepage_li"><a href="/TEST_API_GPT">TEST_API_GPT</a></li>
            <li className="homepage_li"><a href="/ScheduleTest">ScheduleTest</a></li>


        </ul>

        {/* view3的這里 */}
        <ul className="view_3" style={{ margin: '20px',padding:'20px',border:'1px solid'}}>
            <li className="homepage_li"><a href="/header">header</a></li>
            <li className="homepage_li blue"><a className="blue" href="/signin">①signUp</a></li>
            <li className="homepage_li blue"><a className="blue" href="/login">②login</a></li>
            <li className="homepage_li blue"><a className="blue" href="/Profile">③Profile</a></li>
            <li className="homepage_li"><a className="blue" href="/Vistour">④Vistour</a></li>
            <li className="homepage_li"><a href="/logout">logout</a></li>
            <li className="homepage_li"><a href="/forgotPassword">forgotPassword</a></li>
            <li className="homepage_li"><a href="/page2">page2</a></li>
            <li className="homepage_li"><a href="/page3">page3</a></li>
            
            <li className="homepage_li"><a href="/Backend">Backend</a></li>
        </ul>

    </div>

  );
};

export default HomePage;
