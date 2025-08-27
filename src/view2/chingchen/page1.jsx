import React, { useState, createContext } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import AttractionContainer from '../chingchen/AttractionContainer.jsx';
import ScheduleContainer from '../chingchen/scheduleContainer.jsx';
import { CustomDragPreview } from './ScheduleInsert.jsx';
import Header from '../../components/header.jsx'
// import MapDisplay from '../Liu/mapAddRoute/MapDisplay.jsx'

import './Page1.css';


// 建立 Context
export const SelectedScheduleContext = createContext({
    selectedScheduleId: null,
    setSelectedScheduleId: () => {},
});

const Page1 = () => {
    //state
    const [usedAttractions, setUsedAttractions] = useState([]);

    const [currentRoute, setCurrentRoute] = useState(null); // 目前顯示的路線數據

    const [selectedScheduleId, setSelectedScheduleId] = useState(null);


    //function 1: 處理景點被使用的狀態
    const handleAttractionUsed = (a_id,isUsed = true) => {
        // 標記景點為已使用
        if (isUsed) {
            // 如果景點未被使用，則添加到已使用的景點列表
            if (!usedAttractions.includes(a_id)) {
                setUsedAttractions(prev => [...prev, a_id]);
            }
        } else {// 如果景點已被使用，則從已使用的景點列表中移
            setUsedAttractions(prev => prev.filter(attraction_id => attraction_id !== a_id));// 釋放景點使用狀態
        }
    };

    // function 2: 處理顯示路線
    const handleShowRoute = (routeData) => {
        setCurrentRoute(routeData);
        console.log('顯示路線：', routeData);
    };

    // function 3: 處理隱藏路線
    const handleHideRoute = () => {
        setCurrentRoute(null);
        console.log('隱藏路線');
    };

    return (
        <DndProvider backend={HTML5Backend}>
            {/* 自定義拖拽預覽組件 */}
            <CustomDragPreview />

            <SelectedScheduleContext.Provider value={{ selectedScheduleId, setSelectedScheduleId }}>
                <div className="page1">
                    <div className="page1_content">
                        <AttractionContainer usedAttractions={usedAttractions} currentRoute={currentRoute} />
                        <ScheduleContainer
                            t_id={1}//@==@記得改掉@==@
                            usedAttractions={usedAttractions} 
                            onAttractionUsed={handleAttractionUsed}
                            onShowRoute={handleShowRoute}
                            onHideRoute={handleHideRoute}
                        />
                        {/* MapDisplay 放在這裡或其他地方都可以 */}
                        {/* <MapDisplay /> */}
                    </div>

                </div>
            </SelectedScheduleContext.Provider>
        </DndProvider>
    );
};

export default Page1;
