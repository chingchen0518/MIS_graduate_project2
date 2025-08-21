import React, { useEffect} from "react";
import axios from "axios";
import { createContext, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';


//==============================testing area==================================
// import DragAndDropExample from './view2/chingchen/DragAndDropExample.jsx';
// import DragAndDropWithPosition from './view2/chingchen/DragAndDropWithPosition.jsx';
// import DragAndDropExample2 from './view2/chingchen/DragAndDropExample2.jsx';
import MyRndList from './view2/chingchen/test_MyRndList.jsx';
import ResizableBox from './view2/chingchen/ResizableBox.jsx';


//==============================view 1==================================
import Part1 from './view1/part1.jsx';
import TreemapTest from './view1/treemap_chyi.jsx';
import Part2 from './view1/part2.jsx';
import TripList from './view1/tripList.jsx';
import TravelGantt from './view1/test.jsx';         // test.jsx 預設輸出 TravelGantt
/*
import { Toaster } from 'react-hot-toast';     // 給 part2 的 toast
// ③ 因為 Part2 需要 tripId / country 兩個 props，做一個小包裝 Route 元件

import { useParams, useSearchParams } from 'react-router-dom';
const Part2Route = () => {
    const { tId } = useParams();
    const [sp] = useSearchParams();
    const country = sp.get('country') || '瑞士'; // /part2/123?country=瑞士
    return <Part2 tripId={Number(tId)} country={country} />;
};
*/



//==============================view 2==================================
import InteractiveMap from './view2/Liu/map/InteractiveMap.jsx'
import MapDisplay from './view2/Liu/mapAddRoute/MapDisplay.jsx'
import AttractionContainer from './view2/chingchen/AttractionContainer.jsx'
import Page1 from './view2/chingchen/Page1.jsx'
//========================================================================



//=================================view 3============================

import UserProfile from './view2/chingchen/user.jsx';
import Login from './view3/page1/login.jsx';
import Signin from './view3/page1/signin.jsx';
import ForgotPassword from './view3/page1/forgotpassword.jsx';
import Logout from './view3/page1/logout.jsx';
import Profile from './view3/page1/profile.jsx';
import Page2 from './view3/page2/page2.jsx';
import Page3 from './view3/page3/Page3.jsx';

import HomePage from './components/homepage.jsx'
import Header from './components/header.jsx'
import './App.css';
import GeminiChat from './view2/chingchen/TEST API';
import TEST_API_GPT from './view2/chingchen/TEST_API_GPT';

//create context
export const MyContext = createContext();

function App() {
    const [hourInterval, setHourInterval] = useState(35/60);

    const [attractions, setAttractions] = useState([]);
    const [loading, setLoading] = useState(true);

    return (
        <MyContext.Provider value={{ hourInterval, setHourInterval }}>
            <Router>
                {/* <Toaster position="top-center" /> */}

                <Routes>
                    <Route path="/" element={<HomePage />} />
                    
                    <Route path="/part1" element={<Part1 />} />
                    <Route path="/treemap" element={<TreemapTest />} />
                    {/* <Route path="/part2/:tId" element={<Part2Route />} /> */}
                    <Route path="/trips" element={<TripList />} />
                    <Route path="/gantt" element={<TravelGantt />} />

                    <Route path="/AttractionContainer" element={<AttractionContainer />} />
                    <Route path="/map" element={<InteractiveMap />} />
                    <Route path="/page1" element={<Page1 />} />
                    <Route path="/page2" element={<Page2 />} />
                    <Route path="/page3" element={<Page3 />} />
                    <Route path="/header" element={<Header />} />
                    {/* <Route path="/attraction" element={<AttractionContainer />} /> */}
                    <Route path="/MapDisplay" element={<MapDisplay />} />
                    <Route path="/UserProfile" element={<UserProfile />} />
                    <Route path="/Login" element={<Login />} />
                    <Route path="/Signin" element={<Signin />} />
                    <Route path="/ForgotPassword" element={<ForgotPassword />} />
                    <Route path="/Profile" element={<Profile />} />
                    <Route path="/logout" element={<Logout />} />
                    <Route path="/ResizableBox" element={<ResizableBox />} />
                    <Route path="/MyRndList" element={<MyRndList />} />
                    <Route path="/TEST_API" element={<GeminiChat />} />
                    <Route path="/TEST_API_GPT" element={<TEST_API_GPT />} />
                </Routes>
            </Router>
        </MyContext.Provider>
    );
}

export default App;
