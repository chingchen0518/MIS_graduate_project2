import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useSearchParams } from 'react-router-dom';
import AttractionContainer from './AttractionContainer.jsx';
import ScheduleContainer from './ScheduleContainer.jsx';
import { CustomDragPreview } from '../../view2/chingchen/ScheduleInsert.jsx';
import Header from '../../components/header.jsx';

import './Page2.css';

const Page2 = () => {
    //state
    const [usedAttractions, setUsedAttractions] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [searchParams] = useSearchParams();
    const [t_id, setT_id] = useState(null);

    // 從URL參數獲取t_id
    useEffect(() => {
        const tripId = searchParams.get('t_id');
        if (tripId) {
            setT_id(parseInt(tripId));
        } else {
            // 如果沒有t_id參數，使用默認值
            setT_id(1);
        }
    }, [searchParams]);

    //function 1: 處理景點被使用的狀態
    const handleAttractionUsed = (a_id, isUsed = true) => {

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

    //function 2: 處理篩選類別變更
    const handleCategoryFilter = (categories) => {
        setSelectedCategories(categories);
    };

    return (
        <DndProvider backend={HTML5Backend}>
            {/* 自定義拖拽預覽組件 */}
            <CustomDragPreview />

            <div className="page2">
                <Header />

                <div className="page2_content">
                    <AttractionContainer
                        usedAttractions={usedAttractions}
                        selectedCategories={selectedCategories}
                        onCategoryChange={handleCategoryFilter}
                        t_id={t_id}
                    />
                    <ScheduleContainer
                        t_id={t_id}
                        usedAttractions={usedAttractions}
                        onAttractionUsed={handleAttractionUsed}
                    />
                </div>
            </div>
        </DndProvider>
    );
};

export default Page2;
