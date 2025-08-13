import { createContext, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';


//==============================testing area==================================
// import DragAndDropExample from './view2/chingchen/DragAndDropExample.jsx';
// import DragAndDropWithPosition from './view2/chingchen/DragAndDropWithPosition.jsx';
// import DragAndDropExample2 from './view2/chingchen/DragAndDropExample2.jsx';
import MyRndList from './view2/chingchen/test_MyRndList.jsx';
import ResizableBox from './view2/chingchen/ResizableBox.jsx';
//==========================================================================

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
//=====================================================================
import HomePage from './components/homepage.jsx'
import Header from './components/header.jsx'
import './App.css';

//create context
export const MyContext = createContext();

function App() {
    const [hourInterval, setHourInterval] = useState(35/60);

    return (
        <MyContext.Provider value={{ hourInterval, setHourInterval }}>
            <Router>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/AttractionContainer" element={<AttractionContainer />} />
                    <Route path="/map" element={<InteractiveMap />} />
                    <Route path="/page1" element={<Page1 />} />
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
                </Routes>
            </Router>
        </MyContext.Provider>
    );
}

export default App;
