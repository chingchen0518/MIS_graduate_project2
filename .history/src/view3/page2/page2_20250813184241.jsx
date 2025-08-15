import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import AttractionContainer from './AttractionContainer.jsx';
import ScheduleContainer from './ScheduleContainer.jsx';
import { CustomDragPreview } from '../../view2/chingchen/ScheduleInsert.jsx';
import Header from '../../components/header.jsx';
import Filter from './Filter.jsx';

import './Page2.css';

const Page2 = () => {
    //state
    const [usedAttractions, setUsedAttractions] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [filterExpanded, setFilterExpanded] = useState(false);

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

    //function 2: 處理篩選類別變更
    const handleCategoryFilter = (categories) => {
        setSelectedCategories(categories);
    };

    //function 3: 處理篩選器展開狀態變更
    const handleFilterExpandChange = (expanded) => {
        setFilterExpanded(expanded);
    };

    return (
        <DndProvider backend={HTML5Backend}>
            {/* 自定義拖拽預覽組件 */}
            <CustomDragPreview />
            
            <div className="page2">
                <Header/>
                
                <div className="page2_content">
                    <div className="page2_main_layout">
                        {/* Filter 組件獨立在上方 */}
                        <div className={`page2_filter_section ${filterExpanded ? 'expanded' : 'collapsed'}`}>
                            <Filter 
                                t_id={1} 
                                onCategoryChange={handleCategoryFilter}
                                onExpandChange={handleFilterExpandChange}
                            />
                        </div>
                        
                        {/* 主要內容區域在下方 */}
                        <div className="page2_content_section">
                            <AttractionContainer 
                                usedAttractions={usedAttractions} 
                                selectedCategories={selectedCategories}
                            />
                            <ScheduleContainer
                                t_id={1}//@==@記得改掉@==@
                                usedAttractions={usedAttractions} 
                                onAttractionUsed={handleAttractionUsed} 
                            />
                        </div>
                    </div>
                </div>
            </div>
        </DndProvider>
    );
};

export default Page2;
