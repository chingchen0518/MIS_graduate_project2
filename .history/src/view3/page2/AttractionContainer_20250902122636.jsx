import React, { useState, useEffect, useCallback } from 'react';

import AttractionDetail from './AttractionDetail.jsx';
import Filter from './filter.jsx';

import './AttractionContainer.css';

import MapDisplay from './MapDisplay.jsx';

const AttractionContainer = ({ usedAttractions = [], selectedCategories = [], onCategoryChange, onFilterChange, onAttractionSelect, t_id }) => {
    //state
    const [selectedTab, setSelectedTab] = useState('選擇文化村');
    const [showTripPlanning, setShowTripPlanning] = useState(false); // 控制是否顯示行程規劃區域

    const [selectedAttraction, setSelectedAttraction] = useState(null);
    const [draggedAttractions, setDraggedAttractions] = useState(new Set());
    const [attractions, setAttractions] = useState([]);

    // 處理篩選條件變更
    const handleFilterChange = useCallback((costRange, selectedAttractions, selectedUsers) => {
        if (onFilterChange) {
            onFilterChange(costRange, selectedAttractions, selectedUsers);
        }
    }, [onFilterChange]);

    // 處理景點選擇
    const handleAttractionSelect = useCallback((attraction) => {
        setSelectedAttraction(attraction);
        if (onAttractionSelect) {
            onAttractionSelect(attraction);
        }
    }, [onAttractionSelect]);

    // 關閉景點詳情
    const handleCloseDetail = useCallback(() => {
        setSelectedAttraction(null);
    }, []);


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
                />
            </div>

            {/* 新增包裝容器來包含地圖和詳情 */}
            <div className="content_wrapper">
                <div className="map_small_container">
                    <MapDisplay selectedAttraction={selectedAttraction} />
                </div>

                <AttractionDetail
                    attraction={selectedAttraction}
                    onClose={handleCloseDetail}
                />
            </div>
        </div>

    );
};

export default AttractionContainer;