import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Attraction_container from '../chingchen/attraction_container.jsx';
import Schedule_container from '../chingchen/schedule_container.jsx';
import { CustomDragPreview } from './schedule.jsx';
import Header from '../../components/header.jsx'
// import MapDisplay from '../Liu/mapAddRoute/MapDisplay.jsx'

import './page1.css';

const Page1 = () => {
    //state
    const [usedAttractions, setUsedAttractions] = useState([]);

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

    return (
        <DndProvider backend={HTML5Backend}>
            {/* 自定義拖拽預覽組件 */}
            <CustomDragPreview />
            
            <div className="page1">
                <Header/>

                <div className="page1_content">

                    <Attraction_container usedAttractions={usedAttractions} />
                    <Schedule_container
                        t_id={1}//@==@記得改掉@==@
                        usedAttractions={usedAttractions} 
                        onAttractionUsed={handleAttractionUsed} 
                    />
                </div>
            </div>
        </DndProvider>
    );
};

export default Page1;
