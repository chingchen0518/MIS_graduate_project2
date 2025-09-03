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
    t_id
}) => {
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
        console.log('🔄 AttractionContainer 收到景點選擇:', attraction); // 調試信息
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

                {/* 景點詳情顯示在左下角 */}
                {selectedAttraction && (
                    <AttractionDetail
                        attraction={selectedAttraction}
                        onClose={handleCloseDetail}
                    />
                )}
            </div>
        </div>

    );
};

export default AttractionContainer;