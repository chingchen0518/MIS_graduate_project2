import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useSearchParams } from 'react-router-dom';
import AttractionContainer from './AttractionContainer.jsx';
import ScheduleContainer from './ScheduleContainer.jsx';
import { CustomDragPreview } from '../../view2/chingchen/ScheduleInsert.jsx';
import Header from '../../components/header.jsx';

import './Page2.css';

const Page2 = () => {
    // 從 localStorage 獲取用戶和行程資料
    const user = JSON.parse(localStorage.getItem('user'));
    const trip = JSON.parse(localStorage.getItem('trip'));

    //state
    const [usedAttractions, setUsedAttractions] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedAttraction, setSelectedAttraction] = useState(null); // 新增：選中的景點
    const [currentRoute, setCurrentRoute] = useState(null); // 新增：目前顯示的路線數據
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

    // 從localStorage獲取t_id
    useEffect(() => {
        // 優先從localStorage獲取
        if (trip && trip.tid) {
            setT_id(parseInt(trip.tid));
        } else {
            // 如果localStorage中沒有，嘗試從URL參數獲取
            const tripId = searchParams.get('t_id');
            if (tripId) {
                setT_id(parseInt(tripId));
            } else {
                console.log('未找到行程ID，請先選擇行程');
            }
        }
    }, [trip, searchParams]);

    //function 1: 處理景點被使用的狀態
    const handleAttractionUsed = useCallback((a_id, isUsed = true) => {
        // 標記景點為已使用
        if (isUsed) {
            // 如果景點未被使用，則添加到已使用的景點列表
            if (!usedAttractions.includes(a_id)) {
                setUsedAttractions(prev => [...prev, a_id]);
            }
        } else {
            // 如果景點已被使用，則從已使用的景點列表中移除
            setUsedAttractions(prev => prev.filter(attraction_id => attraction_id !== a_id));
        }
    }, [usedAttractions]);

    // function 2: 處理景點選擇
    const handleAttractionSelect = useCallback((attraction) => {
        setSelectedAttraction(attraction);
        // 當選擇新景點時，清除當前的路線顯示
        setCurrentRoute(null);
    }, []);

    // function 3: 處理顯示路線
    const handleShowRoute = useCallback((routeData) => {
        // 顯示路線時清除選中的景點
        setSelectedAttraction(null);
        setCurrentRoute(routeData);
    }, []);

    // function 4: 處理隱藏路線
    const handleHideRoute = useCallback(() => {
        setCurrentRoute(null);
    }, []);

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
                        selectedAttraction={selectedAttraction}
                        currentRoute={currentRoute}
                        onCategoryChange={handleCategoryFilter}
                        onFilterChange={handleFilterChange}
                        onAttractionSelect={handleAttractionSelect}
                        t_id={t_id}
                    />
                    <ScheduleContainer
                        t_id={t_id}
                        usedAttractions={usedAttractions}
                        onAttractionUsed={handleAttractionUsed}
                        onAttractionSelect={handleAttractionSelect}
                        onShowRoute={handleShowRoute}
                        onHideRoute={handleHideRoute}
                        filterConditions={filterConditions}
                    />
                </div>
            </div>
        </DndProvider>
    );
};

export default Page2;
