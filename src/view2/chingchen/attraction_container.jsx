import React, { useState, useEffect } from 'react';
import AttractionCard from './attraction_card.jsx';
import AttractionDetail from './attraction_detail.jsx';
import MapDisplay from '../Liu/mapAddRoute/MapDisplay.jsx'; // 導入地圖組件

import './attraction_container.css';

const Attraction_container = () => {
  const [selectedTab, setSelectedTab] = useState('選擇文化村');
  const [selectedAttraction, setSelectedAttraction] = useState(null);
  const [draggedAttractions, setDraggedAttractions] = useState(new Set());
  const [attractions, setAttractions] = useState([]);

  const [attractions, setAttractions] = useState([]);
  const [showTripPlanning, setShowTripPlanning] = useState(false); // 控制是否顯示行程規劃區域

  useEffect(() => {
    // Fetch data from the API
    fetch('http://localhost:3001/api/view2_attraction_list')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setAttractions(data);
      })
      .catch(error => {
        console.error('Error fetching attractions:', error);
      });
  }, []);


  const handleCardClick = (attraction) => {
    setSelectedAttraction(attraction);
  };

  const handleDragStart = (attractionId) => {
    setDraggedAttractions(prev => new Set([...prev, attractionId]));
  };

  const handleDragEnd = (attractionId) => {
    // 保持拖拽狀態，直到頁面重新載入或手動重置
  };

  const handleAddTrip = () => {
    setShowTripPlanning(true);
  };

  return (
    <div className="attraction_container">


      <div className="attraction_cards_wrapper">
        {attractions.map(attraction => (
          <AttractionCard 
            key={attraction.id}
            name={attraction.name}
            category={attraction.category}
            votes={attraction.votes}
            color={attraction.color}
            address={attraction.address}
            hours={attraction.hours}
            phone={attraction.phone}
            budget={attraction.budget}
            isSelected={selectedAttraction?.id === attraction.id}
            isDragged={draggedAttractions.has(attraction.id)}
            onClick={() => handleCardClick(attraction)}
            onDragStart={() => handleDragStart(attraction.id)}
            onDragEnd={() => handleDragEnd(attraction.id)}
          />
        ))}
      </div>

      <div className="map_small_container">
        <MapDisplay selectedAttraction={selectedAttraction} />
      </div>

      {/* <div className="map_small_container">
        <MapDisplay />
      </div> */}
      <AttractionDetail attraction={selectedAttraction} />
    </div>

  );
};

export default Attraction_container;