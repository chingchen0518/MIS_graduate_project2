import React, { useState, useEffect } from 'react';

import AttractionDetail from './AttractionDetail.jsx';
import Filter from './filter.jsx';

import './AttractionContainer.css';

import MapDisplay from './MapDisplay.jsx';
const AttractionContainer = ({ usedAttractions = [], selectedCategories = [], onCategoryChange, onFilterChange, t_id }) => {
    //state
    const [selectedTab, setSelectedTab] = useState('選擇文化村');
    const [showTripPlanning, setShowTripPlanning] = useState(false); // 控制是否顯示行程規劃區域

    const [selectedAttraction, setSelectedAttraction] = useState(null);
    const [draggedAttractions, setDraggedAttractions] = useState(new Set());
    const [attractions, setAttractions] = useState([]);

    // 處理篩選條件變更
    const handleFilterChange = (costRange, selectedAttractions, selectedUsers) => {
        if (onFilterChange) {
            onFilterChange(costRange, selectedAttractions, selectedUsers);
        }
    };


    //   const handleAddTrip = () => {
    //     setShowTripPlanning(true);
    //   };

    return (
        <div className="attraction_container">
<<<<<<< HEAD
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

                <AttractionDetail attraction={selectedAttraction} />
            </div>
=======
            <Filter />
            <div className="map_small_container">
                <MapDisplay selectedAttraction={selectedAttraction} />
            </div>

            <AttractionDetail attraction={selectedAttraction} />
>>>>>>> c882ed7c60bdf0b208d2a81274e8775c2621ad87
        </div>

    );
};

export default AttractionContainer;