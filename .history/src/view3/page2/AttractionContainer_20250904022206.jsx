import React, { useState, useEffect, useCallback } from 'react';

import AttractionDetail from './AttractionDetail.jsx';
import Filter from './filter.jsx';

import './AttractionContainer.css';

import MapDisplay from './MapDisplay.jsx';

const AttractionContainer = ({
    usedAttractions = [],
    selectedCategories = [],
    selectedAttraction = null,
    currentRoute = null,
    onCategoryChange,
    onFilterChange,
    onAttractionSelect,
    t_id: propsTId
}) => {
    // 從 localStorage 獲取用戶和行程資料
    const user = JSON.parse(localStorage.getItem('user'));
    const trip = JSON.parse(localStorage.getItem('trip'));
    
    // 使用從localStorage獲取的t_id，如果沒有則使用props中的t_id
    const t_id = trip?.tid ? parseInt(trip.tid) : propsTId;
    //state
    const [selectedTab, setSelectedTab] = useState('選擇文化村');
    const [showTripPlanning, setShowTripPlanning] = useState(false); // 控制是否顯示行程規劃區域
    const [draggedAttractions, setDraggedAttractions] = useState(new Set());
    const [attractions, setAttractions] = useState([]);

    // 處理篩選條件變更
    const handleFilterChange = useCallback((costRange, selectedAttractions, selectedUsers) => {
        if (onFilterChange) {
            onFilterChange(costRange, selectedAttractions, selectedUsers);
        }
    }, [onFilterChange]);

    // 處理景點選擇 - 使用父組件傳入的函數
    const handleAttractionSelect = useCallback((attraction) => {
        if (onAttractionSelect) {
            onAttractionSelect(attraction);
        }
    }, [onAttractionSelect]);

    // 關閉景點詳情
    const handleCloseDetail = useCallback(() => {
        if (onAttractionSelect) {
            onAttractionSelect(null);
        }
    }, [onAttractionSelect]);


    //   const handleAddTrip = () => {
    //     setShowTripPlanning(true);
    //   };

    return (
        <div className="attraction_container">
            {/* Filter組件放在AttractionContainer的頂部 */}
            <div className="filter_section">
                <Filter
                    t_id={t_id}
                    onCategoryChange={onCategoryChange}
                    onFilterChange={handleFilterChange}
                    onAttractionSelect={handleAttractionSelect}
                />
            </div>

            {/* 新增包裝容器來包含地圖和詳情 */}
            <div className="content_wrapper">
                <div className="map_small_container">
                    <MapDisplay
                        selectedAttraction={selectedAttraction}
                        currentRoute={currentRoute}
                    />
                </div>

                {/* 景點詳情顯示在地圖下方 - 總是顯示 */}
                <AttractionDetail
                    attraction={selectedAttraction}
                    onClose={handleCloseDetail}
                />
            </div>
        </div>

    );
};

export default AttractionContainer;