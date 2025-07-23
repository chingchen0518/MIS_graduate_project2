import React, { useState } from 'react';
import AttractionCard from './attraction_card.jsx';
import AttractionDetail from './attraction_detail.jsx';

import './attraction_container.css';

const Attraction_container = () => {
  const [selectedTab, setSelectedTab] = useState('選擇文化村');
  const [selectedAttraction, setSelectedAttraction] = useState(null);
  const [draggedAttractions, setDraggedAttractions] = useState(new Set());
<<<<<<< Updated upstream
  const [attractions, setAttractions] = useState([
    {
      id: 1,
      name: '十鼓文化村',
      category: '文化',
      votes: 15,
      color: '#4A90E2'
    },
    {
      id: 2,
      name: '嘉義宮輪館',
      category: '文化',
      votes: 12,
      color: '#4A90E2'
    },
    {
      id: 3,
      name: '台北101',
      category: '地標',
      votes: 25,
      color: '#5CB85C'
    },
    {
      id: 4,
      name: '九份老街',
      category: '老街',
      votes: 18,
      color: '#9C27B0'
    },
    {
      id: 5,
      name: '淡水漁人碼頭',
      category: '景觀',
      votes: 20,
      color: '#FF9800'
    },
    {
      id: 6,
      name: '故宮博物院',
      category: '博物館',
      votes: 22,
      color: '#2196F3'
    },
    {
      id: 7,
      name: '陽明山',
      category: '自然',
      votes: 16,
      color: '#4CAF50'
    },
    {
      id: 8,
      name: '士林夜市',
      category: '美食',
      votes: 30,
      color: '#E91E63'
    },
    {
      id: 9,
      name: '日月潭',
      category: '自然',
      votes: 28,
      color: '#4CAF50'
    },
    {
      id: 10,
      name: '墾丁國家公園',
      category: '自然',
      votes: 24,
      color: '#4CAF50'
    }
  ]);
=======
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
>>>>>>> Stashed changes

  const handleCardClick = (attraction) => {
    setSelectedAttraction(attraction);
  };

  const handleDragStart = (attractionId) => {
    setDraggedAttractions(prev => new Set([...prev, attractionId]));
  };

  const handleDragEnd = (attractionId) => {
    // 保持拖拽狀態，直到頁面重新載入或手動重置
    // setDraggedAttractions(prev => {
    //   const newSet = new Set(prev);
    //   newSet.delete(attractionId);
    //   return newSet;
    // });
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
              isSelected={selectedAttraction?.id === attraction.id}
              isDragged={draggedAttractions.has(attraction.id)}
              onClick={() => handleCardClick(attraction)}
              onDragStart={() => handleDragStart(attraction.id)}
              onDragEnd={() => handleDragEnd(attraction.id)}
            />
          ))}
        </div>
        <AttractionDetail attraction={selectedAttraction} />
      </div>
<<<<<<< Updated upstream
=======
      <div className="map_small_container">
        <MapDisplay selectedAttraction={selectedAttraction} />
      </div>
      {/* <div className="map_small_container">
        <MapDisplay />
      </div> */}
      <AttractionDetail attraction={selectedAttraction} />
    </div>
>>>>>>> Stashed changes
  );
};

export default Attraction_container;