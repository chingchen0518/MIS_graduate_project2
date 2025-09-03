import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useSearchParams } from 'react-router-dom';
import AttractionContainer from './AttractionContainer.jsx';
import ScheduleContainer from './ScheduleContainer.jsx';
import AttractionDetail from './AttractionDetail.jsx';
import TransportTime from './TransportTime.jsx';
import MapDisplay from './MapDisplay.jsx';
import { CustomDragPreview } from '../../view2/chingchen/ScheduleInsert.jsx';
import Header from '../../components/header.jsx';

import './Page2.css';

const Page2 = () => {
    //state
    const [usedAttractions, setUsedAttractions] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [filterConditionsState, setFilterConditionsState] = useState({
        costRange: [0, 1000],
        selectedAttractions: [],
        selectedUsers: []
    });
    const [searchParams] = useSearchParams();
    const [t_id, setT_id] = useState(null);    // 使用 useMemo 來避免 filterConditions 物件每次都重新創建
    const filterConditions = useMemo(() => ({
        costRange: filterConditionsState.costRange,
        selectedAttractions: filterConditionsState.selectedAttractions,
        selectedUsers: filterConditionsState.selectedUsers
    }), [filterConditionsState.costRange, filterConditionsState.selectedAttractions, filterConditionsState.selectedUsers]);

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
    const handleAttractionUsed = useCallback((a_id, isUsed = true) => {
        // 標記景點為已使用
        if (isUsed) {
            // 如果景點未被使用，則添加到已使用的景點列表
            if (!usedAttractions.includes(a_id)) {
                setUsedAttractions(prev => [...prev, a_id]);
            }
        } else {// 如果景點已被使用，則從已使用的景點列表中移
            setUsedAttractions(prev => prev.filter(attraction_id => attraction_id !== a_id));// 釋放景點使用狀態
        }
    }, [usedAttractions]);

    //function 2: 處理篩選類別變更
    const handleCategoryFilter = useCallback((categories) => {
        setSelectedCategories(categories);
    }, []);

    //function 3: 處理篩選條件變更
    const handleFilterChange = useCallback((costRange, selectedAttractions, selectedUsers) => {
        setFilterConditionsState({
            costRange,
            selectedAttractions,
            selectedUsers
        });
    }, []);

    //function 4: 處理景點選擇
    const handleAttractionSelect = useCallback((attraction) => {
        setSelectedAttraction(attraction);
        setShowAttractionDetail(true);
        setShowMap(true);
    }, []);

    //function 5: 關閉景點詳情
    const handleCloseAttractionDetail = useCallback(() => {
        setShowAttractionDetail(false);
        setSelectedAttraction(null);
    }, []);

    //function 6: 處理路線變更
    const handleRouteChange = useCallback((route) => {
        setCurrentRoute(route);
        setShowMap(true);
    }, []);

    return (
        <DndProvider backend={HTML5Backend}>
            {/* 自定義拖拽預覽組件 */}
            <CustomDragPreview />

            <div className="page2">
                {/* <Header /> */}

                <div className="page2_content">
                    <AttractionContainer
                        usedAttractions={usedAttractions}
                        selectedCategories={selectedCategories}
                        onCategoryChange={handleCategoryFilter}
                        onFilterChange={handleFilterChange}
                        onAttractionSelect={handleAttractionSelect}
                        t_id={t_id}
                    />
                    <ScheduleContainer
                        t_id={t_id}
                        usedAttractions={usedAttractions}
                        onAttractionUsed={handleAttractionUsed}
                        onRouteChange={handleRouteChange}
                        filterConditions={filterConditions}
                    />
                </div>
            </div>
        </DndProvider>
    );
};

export default Page2;
