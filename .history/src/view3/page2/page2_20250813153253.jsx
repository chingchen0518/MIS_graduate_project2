import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import AttractionContainer from '../../view2/chingchen/AttractionContainer.jsx';
import ScheduleContainer from '../../view2/chingchen/scheduleContainer.jsx';
import { CustomDragPreview } from '../../view2/ScheduleInsert.jsx';
import Header from '../../viw2/components/header.jsx'
// import MapDisplay from '../Liu/mapAddRoute/MapDisplay.jsx'

import './Page2.css';

const Page2 = () => {
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
            
            <div className="page2">
                <Header/>

                <div className="page2_content">

                    <AttractionContainer usedAttractions={usedAttractions} />
                    <ScheduleContainer
                        t_id={1}//@==@記得改掉@==@
                        usedAttractions={usedAttractions} 
                        onAttractionUsed={handleAttractionUsed} 
                    />
                </div>
            </div>
        </DndProvider>
    );
};

export default Page2;
